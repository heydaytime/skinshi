import { InventorySchema, SteamProfile, SteamProfileSchema } from '@skinshi/steam-service/schemas';
import { users, bets } from '../db/schema';
import { publicProcedure, protectedProcedure, protectedSteamAuthedProcedure } from '../trpc';
import z from 'zod';
import { fetchFromMicroservice } from '../services';
import { BetSchema } from '../schemas/bet';
import { eq } from 'drizzle-orm';

export const helloProcedure = publicProcedure.query(async ({ ctx }) => {
	const allUsers = await ctx.drizzle.select().from(users).all();
	return {
		message: `Found ${allUsers.length} users`,
		users: allUsers,
	};
});

export const meProcedure = protectedProcedure.query(({ ctx }) => {
	return {
		valid: true,
		firebaseUser: ctx.firebaseUser,
		dbUser: ctx.dbUser,
	};
});

export const myProfile = protectedSteamAuthedProcedure
	.output(SteamProfileSchema)
	// @ts-ignore - TRPC doesnt understand the union input properly
	.query(async ({ input, ctx }) => {
		const steamId = ctx.dbUser.steamId;
		console.log(`Fetching Steam profile for Steam ID: ${steamId}`);
		const url = `${ctx.env.STEAM_SERVICE_URL}/profile/id/${steamId}`;
		return fetchFromMicroservice<SteamProfile>(url, 'Failed to fetch Steam profile by id');
	});

export const myInventory = protectedSteamAuthedProcedure
	.output(InventorySchema)
	// @ts-ignore - TRPC doesnt understand the union input properly
	.query(async ({ input, ctx }) => {
		const steamId = ctx.dbUser.steamId;
		console.log(`Fetching inventory for Steam ID: ${steamId}`);
		const url = `${ctx.env.STEAM_SERVICE_URL}/inventory/id/${steamId}`;
		return fetchFromMicroservice(url, 'Failed to fetch inventory by id');
	});

export const myBets = protectedSteamAuthedProcedure.output(z.array(BetSchema)).query(async ({ ctx }) => {
	const steamId = ctx.dbUser.steamId;
	console.log(`Fetching bets for Steam ID: ${steamId}`);
	const userBets = await ctx.drizzle.select().from(bets).where(eq(bets.steamId, steamId)).all();

	return userBets.map((bet) => ({
		steamId: bet.steamId,
		marketId: bet.marketId,
		marketOutcome: bet.marketOutcome,
		buyIn: bet.buyIn,
		payout: bet.payout,
		status: bet.status as 'active' | 'payout_pending' | 'lost' | 'cancelled',
		createdAt: bet.createdAt,
		resolvedAt: bet.resolvedAt,
	}));
});
