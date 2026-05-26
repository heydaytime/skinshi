import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { protectedSteamAuthedProcedure } from '../trpc';
import { postToMicroservice } from '../services';
import { BetSchema, PlaceBetSchema, ClaimPayoutSchema } from '../schemas/bet';
import { markets, bets } from '../db/schema';

const BOT_STEAM_ID = '1234';

export const trade = protectedSteamAuthedProcedure.input(PlaceBetSchema).mutation(async ({ input, ctx }) => {
	const { slug, id: marketId, marketOutcome, tradeUrl, message, items } = input;
	const slugAndId = `${slug}-${marketId}`;

	console.log(`Placing bet on market ${slugAndId} with ${items.length} items`);

	const market = await ctx.drizzle.select().from(markets).where(eq(markets.slugAndId, slugAndId)).get();

	if (!market) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: `Market ${slugAndId} not found`,
		});
	}

	if (market.status !== 'open') {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: `Market ${slugAndId} is not open for betting (status: ${market.status})`,
		});
	}

	const existingBet = await ctx.drizzle
		.select()
		.from(bets)
		.where(and(eq(bets.steamId, ctx.dbUser.steamId), eq(bets.marketId, slugAndId)))
		.get();

	if (existingBet) {
		throw new TRPCError({
			code: 'CONFLICT',
			message: `You already have an active bet on market ${slugAndId}`,
		});
	}

	const serviceUrl = `${ctx.env.STEAM_SERVICE_URL}/trade/request`;
	const tradePayload = {
		tradeUrl,
		message,
		theirAssets: items.map((item) => ({
			appid: item.appid || '730',
			contextid: item.contextid || '2',
			assetid: item.assetid,
		})),
	};

	const tradeResult = await postToMicroservice<{ ok: boolean; tradeId?: string }>(serviceUrl, tradePayload, 'Failed to send trade offer');

	if (!tradeResult.ok) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Trade offer failed',
		});
	}

	const now = Math.floor(Date.now() / 1000);
	const buyInValue = {
		botSteamId: BOT_STEAM_ID,
		clientSteamId: ctx.dbUser.steamId,
		items: items.map((item) => ({
			classid: item.classid,
			assetid: item.assetid,
		})),
	};

	await ctx.drizzle.insert(bets).values({
		steamId: ctx.dbUser.steamId,
		marketId: slugAndId,
		marketOutcome: marketOutcome,
		buyIn: buyInValue,
		payout: null,
		status: 'active',
		createdAt: now,
		resolvedAt: null,
	});

	const itemCount = items.length;
	await ctx.drizzle
		.update(markets)
		.set({
			totalPoolYes: marketOutcome === 1 ? market.totalPoolYes + itemCount : market.totalPoolYes,
			totalPoolNo: marketOutcome === 0 ? market.totalPoolNo + itemCount : market.totalPoolNo,
		})
		.where(eq(markets.slugAndId, slugAndId));

	console.log(`Bet created for ${ctx.dbUser.steamId} on ${slugAndId} with ${itemCount} items`);

	return {
		success: true,
		marketId: slugAndId,
		itemsBet: itemCount,
		tradeId: tradeResult.tradeId,
	};
});

export const claimPayout = protectedSteamAuthedProcedure.input(ClaimPayoutSchema).mutation(async ({ input, ctx }) => {
	const { marketId, tradeUrl } = input;
	const steamId = ctx.dbUser.steamId;

	console.log(`Claiming payout for bet on market ${marketId} by user ${steamId}`);

	const bet = await ctx.drizzle
		.select()
		.from(bets)
		.where(and(eq(bets.steamId, steamId), eq(bets.marketId, marketId)))
		.get();

	if (!bet) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: `Bet on market ${marketId} not found`,
		});
	}

	if (bet.status !== 'payout_pending') {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: `Bet is not in payout_pending status (current status: ${bet.status})`,
		});
	}

	const payoutCases = bet.buyIn.items.length;

	const serviceUrl = `${ctx.env.STEAM_SERVICE_URL}/trade/send`;
	const sendPayload = {
		tradeUrl,
		caseCount: payoutCases,
	};

	const sendResult = await postToMicroservice<{
		ok: boolean;
		offerId?: string;
		status?: string;
		casesSent?: number;
		items?: Array<{ classid: string; assetid: string }>;
	}>(serviceUrl, sendPayload, 'Failed to send payout cases');

	if (!sendResult.ok || !sendResult.items) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to send payout cases via steam service',
		});
	}

	const now = Math.floor(Date.now() / 1000);
	const payoutValue = {
		botSteamId: BOT_STEAM_ID,
		clientSteamId: steamId,
		items: sendResult.items,
	};

	await ctx.drizzle
		.update(bets)
		.set({
			status: 'paid',
			payout: payoutValue,
			resolvedAt: now,
		})
		.where(and(eq(bets.steamId, steamId), eq(bets.marketId, marketId)));

	console.log(`Payout claimed successfully for ${steamId} on ${marketId}, sent ${payoutCases} cases`);

	return {
		success: true,
		marketId,
		casesSent: payoutCases,
	};
});
