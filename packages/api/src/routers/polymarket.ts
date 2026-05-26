import z from 'zod';
import { publicProcedure } from '../trpc';
import { Market } from '@skinshi/polymarket-service/schemas';
import { OurMarketSchema, mapToOurMarket } from '../schemas/market';
import { fetchFromMicroservice, postToMicroservice } from '../services';
import { markets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const market = publicProcedure
	.input(z.object({ slug: z.string(), id: z.string() }))
	.output(OurMarketSchema)
	.query(async ({ input, ctx }) => {
		const slugAndId = `${input.slug}-${input.id}`;
		const dbMarket = await ctx.drizzle.select().from(markets).where(eq(markets.slugAndId, slugAndId)).get();

		if (!dbMarket) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: `Market with slug ${input.slug} and id ${input.id} not found in database`,
			});
		}

		const url = `${ctx.env.POLYMARKET_SERVICE_URL}/market/${input.slug}?id=${input.id}`;
		const polymarketData = await fetchFromMicroservice<Market>(url, 'Failed to fetch market data');

		return mapToOurMarket(dbMarket, polymarketData);
	});

export const allMarkets = publicProcedure.output(z.array(OurMarketSchema)).query(async ({ ctx }) => {
	const allDbMarkets = await ctx.drizzle.select().from(markets).all();

	console.log(`Found ${allDbMarkets.length} markets in database`);

	if (allDbMarkets.length === 0) {
		return [];
	}

	const batchRequests = allDbMarkets.map((dbMarket) => {
		const parts = dbMarket.slugAndId.split('-');
		const id = parts[parts.length - 1];
		const slug = dbMarket.slugAndId.substring(0, dbMarket.slugAndId.length - id.length - 1);
		return { slug, id };
	});

	console.log(`[allMarkets] Fetching ${batchRequests.length} markets in batch`);

	const url = `${ctx.env.POLYMARKET_SERVICE_URL}/markets`;
	const polymarketDataArray = await postToMicroservice<Market[]>(url, batchRequests, 'Failed to fetch markets data');

	console.log(`[allMarkets] Successfully fetched ${polymarketDataArray.length} markets`);

	const marketData = allDbMarkets.map((dbMarket, index) => {
		const polymarketData = polymarketDataArray[index];
		return mapToOurMarket(dbMarket, polymarketData);
	});

	const sortedMarketData = marketData.sort((a, b) => {
		const aIsInactive = a.status === 'resolved' || a.status === 'cancelled';
		const bIsInactive = b.status === 'resolved' || b.status === 'cancelled';
		if (aIsInactive === bIsInactive) return 0;
		return aIsInactive ? 1 : -1;
	});

	return sortedMarketData;
});
