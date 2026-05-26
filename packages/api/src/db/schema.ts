import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
	steamId: text('steam_id').primaryKey(),
	userId: text('firebase_uid').notNull().unique(),
	email: text('email').notNull(),
	createdAt: integer('created_at').default(sql`(unixepoch())`),
});

export const markets = sqliteTable('markets', {
	slugAndId: text('slug_and_id').primaryKey(),
	status: text('status').notNull(), // 'open', 'closed', 'resolved', 'cancelled'
	outcome: integer('outcome'), // 1=yes, 0=no, null=unresolved
	totalPoolYes: integer('total_pool_yes').notNull().default(0),
	totalPoolNo: integer('total_pool_no').notNull().default(0),
	resolvedAt: integer('resolved_at'),
	createdAt: integer('created_at')
		.notNull()
		.default(sql`(unixepoch())`),
});

export const bets = sqliteTable(
	'bets',
	{
		steamId: text('steam_id')
			.notNull()
			.references(() => users.steamId),
		marketId: text('market_id')
			.notNull()
			.references(() => markets.slugAndId),
		marketOutcome: integer('market_outcome').notNull(), // 1=yes, 0=no
		buyIn: text('buy_in', { mode: 'json' })
			.$type<{
				botSteamId: string;
				clientSteamId: string;
				items: Array<{ classid: string; assetid: string }>;
			}>()
			.notNull(),
		payout: text('payout', { mode: 'json' })
			.$type<{
				botSteamId: string;
				clientSteamId: string;
				items: Array<{ classid: string; assetid: string }>;
			} | null>()
			.default(sql`null`),
		status: text('status').notNull(), // 'active', 'payout_pending', 'lost', 'cancelled'
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(unixepoch())`),
		resolvedAt: integer('resolved_at'),
	},
	(table) => [primaryKey({ columns: [table.steamId, table.marketId] })],
);

export type DbUser = typeof users.$inferSelect;
export type DbMarket = typeof markets.$inferSelect;
export type DbBet = typeof bets.$inferSelect;
