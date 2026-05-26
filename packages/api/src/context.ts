import type { DrizzleClient } from './db';
import type { DbUser } from './db/schema';
import type { FirebaseUser } from './types';

export interface TRPCContext {
	env: {
		db: D1Database;
		cache: KVNamespace;
		ENVIRONMENT?: string;
		FIREBASE_PROJECT_ID: string;
		BACKEND_URL: string;
		POLYMARKET_SERVICE_URL: string;
		STEAM_SERVICE_URL: string;
		FRONTEND_URL: string;
	};
	isAdmin: boolean;
	drizzle: DrizzleClient;
	firebaseUser: FirebaseUser | null;
	dbUser: DbUser | null;
	[token: string]: unknown;
}
