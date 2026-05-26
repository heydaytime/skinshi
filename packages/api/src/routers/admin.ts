import z from 'zod';
import { publicProcedure } from '../trpc';
import { fetchFromMicroservice } from '../services';
import { Market } from '@skinshi/polymarket-service/schemas';
import { markets, bets } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { mapToOurMarket, OurMarketSchema } from '../schemas/market';
import { TRPCError } from '@trpc/server';

export const addMarket = publicProcedure
	.input(z.object({ slug: z.string(), id: z.string() }))
	.output(OurMarketSchema)
	.mutation(async ({ input, ctx }) => {
		if (!ctx.isAdmin) {
			throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to perform this action' });
		}

		const slugAndId = `${input.slug}-${input.id}`;
		const url = `${ctx.env.POLYMARKET_SERVICE_URL}/market/${input.slug}?id=${input.id}`;

		const polymarketData = await fetchFromMicroservice<Market>(url, 'Failed to fetch market data');

		if (!polymarketData) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `Market with slug ${input.slug} and id ${input.id} not found in Polymarket service`,
			});
		}

		if (polymarketData.resolutionState != 'inprogress') {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: `Market with slug ${input.slug} and id ${input.id} is not in progress and cannot be added`,
			});
		}

		const existingMarket = await ctx.drizzle.select().from(markets).where(eq(markets.slugAndId, slugAndId)).get();

		if (existingMarket) {
			throw new TRPCError({
				code: 'CONFLICT',
				message: `Market with slug ${input.slug} and id ${input.id} already exists in database`,
			});
		}

		const newMarket = {
			slugAndId,
			status: 'open',
			outcome: null,
			totalPoolYes: 0,
			totalPoolNo: 0,
			resolvedAt: null,
			createdAt: Date.now(),
		};

		const [insertedMarket] = await ctx.drizzle.insert(markets).values(newMarket).returning();

		console.log(`Inserted new market into database with slugAndId: ${insertedMarket}`);

		return mapToOurMarket(insertedMarket, polymarketData);
	});

export const deleteMarket = publicProcedure
	.input(z.object({ slug: z.string(), id: z.string() }))
	.mutation(async ({ input, ctx }) => {
		if (!ctx.isAdmin) {
			throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to perform this action' });
		}

		const slugAndId = `${input.slug}-${input.id}`;
		console.log(`Attempting to delete market with slugAndId: ${slugAndId}`);

		const existingMarket = await ctx.drizzle.select().from(markets).where(eq(markets.slugAndId, slugAndId)).get();

		if (!existingMarket) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `Market with slug ${input.slug} and id ${input.id} not found`,
			});
		}

		await ctx.drizzle.delete(bets).where(eq(bets.marketId, slugAndId));
		await ctx.drizzle.delete(markets).where(eq(markets.slugAndId, slugAndId));

		console.log(`Successfully deleted market ${slugAndId} and associated bets`);

		return { success: true, slugAndId };
	});

export const resolveMarket = publicProcedure
	.input(z.object({ slug: z.string(), id: z.string(), outcome: z.enum(['yes', 'no', 'cancelled']) }))
	.mutation(async ({ input, ctx }) => {
		if (!ctx.isAdmin) {
			throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to perform this action' });
		}

		const slugAndId = `${input.slug}-${input.id}`;
		const existingMarket = await ctx.drizzle.select().from(markets).where(eq(markets.slugAndId, slugAndId)).get();

		if (!existingMarket) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `Market with slug ${input.slug} and id ${input.id} not found`,
			});
		}

		const outcome = input.outcome === 'yes' ? 1 : input.outcome === 'no' ? 0 : null;

		const [updatedMarket] = await ctx.drizzle
			.update(markets)
			.set({
				status: input.outcome === 'cancelled' ? 'cancelled' : 'resolved',
				outcome,
				resolvedAt: Date.now(),
			})
			.where(eq(markets.slugAndId, slugAndId))
			.returning();

		return updatedMarket;
	});

export const syncBets = publicProcedure.mutation(async ({ ctx }) => {
	if (!ctx.isAdmin) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to perform this action' });
	}

	const now = Date.now();
	let updatedCount = 0;
	let lostCount = 0;
	let payoutCount = 0;
	let cancelledCount = 0;

	const resolvedMarkets = await ctx.drizzle.select().from(markets).where(inArray(markets.status, ['resolved', 'cancelled']));
	const resolvedMarketIds = resolvedMarkets.map((m) => m.slugAndId);

	if (resolvedMarketIds.length === 0) {
		return { totalUpdated: 0, lost: 0, payoutPending: 0, cancelled: 0 };
	}

	const activeBets = await ctx.drizzle
		.select()
		.from(bets)
		.where(and(eq(bets.status, 'active'), inArray(bets.marketId, resolvedMarketIds)));

	for (const bet of activeBets) {
		const market = resolvedMarkets.find((m) => m.slugAndId === bet.marketId);
		if (!market) continue;

		let newStatus: string | null = null;

		if (market.status === 'cancelled') {
			newStatus = 'cancelled';
			cancelledCount++;
		} else if (market.status === 'resolved') {
			if (market.outcome !== null && market.outcome === bet.marketOutcome) {
				newStatus = 'payout_pending';
				payoutCount++;
			} else {
				newStatus = 'lost';
				lostCount++;
			}
		}

		if (newStatus) {
			await ctx.drizzle
				.update(bets)
				.set({ status: newStatus, resolvedAt: now })
				.where(and(eq(bets.steamId, bet.steamId), eq(bets.marketId, bet.marketId)));
			updatedCount++;
		}
	}

	return {
		totalUpdated: updatedCount,
		lost: lostCount,
		payoutPending: payoutCount,
		cancelled: cancelledCount,
	};
});
