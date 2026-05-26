import z from 'zod';
import type { DbMarket } from '../db/schema';
import type { Market } from '@skinshi/polymarket-service/schemas';

export const OurMarketSchema = z.object({
	slug: z.string(),
	id: z.string(),
	status: z.enum(['open', 'closed', 'resolved', 'cancelled']),
	outcome: z.number().nullable().optional(),
	totalPoolYes: z.number(),
	totalPoolNo: z.number(),
	resolvedAt: z.number().nullable().optional(),
	createdAt: z.number(),
	question: z.string(),
	icon: z.string().optional().nullable(),
	endDate: z.date(),
	polymarketYesProbability: z.number().nullable(),
	polymarketResolutionState: z.enum(['inprogress', 'yes', 'no']),
});

export type OurMarket = z.infer<typeof OurMarketSchema>;

export function mapToOurMarket(dbMarket: DbMarket, polymarketData: Market): OurMarket {
	const lastDashIndex = dbMarket.slugAndId.lastIndexOf('-');
	const slug = dbMarket.slugAndId.substring(0, lastDashIndex);
	const id = dbMarket.slugAndId.substring(lastDashIndex + 1);

	return {
		slug,
		id,
		status: dbMarket.status as 'open' | 'closed' | 'resolved' | 'cancelled',
		outcome: dbMarket.outcome,
		totalPoolYes: dbMarket.totalPoolYes,
		totalPoolNo: dbMarket.totalPoolNo,
		resolvedAt: dbMarket.resolvedAt,
		createdAt: dbMarket.createdAt,
		question: polymarketData.question,
		icon: polymarketData.icon,
		endDate: polymarketData.endDateIso,
		polymarketYesProbability: calculatePolymarketYesProbability(polymarketData),
		polymarketResolutionState: polymarketData.resolutionState,
	};
}

function calculatePolymarketYesProbability(polymarketData: Market): number | null {
	const { bestBid, bestAsk, lastTradePrice } = polymarketData;

	if (bestBid != null && bestAsk != null) {
		const spread = bestAsk - bestBid;
		if (spread <= 0.1) {
			return (bestBid + bestAsk) / 2;
		}
	}

	if (lastTradePrice != null) {
		return lastTradePrice;
	}

	if (bestBid != null) return bestBid;
	if (bestAsk != null) return bestAsk;

	return null;
}
