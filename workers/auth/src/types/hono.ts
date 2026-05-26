import type { Context, MiddlewareHandler } from 'hono';
import { users } from '@skinshi/api/db/schema';
import { FirebaseUser } from '@skinshi/api/types';

declare module 'hono' {
	interface ContextVariableMap {
		firebaseUser: FirebaseUser | null;
		dbUser: typeof users.$inferSelect | null;
	}
}

export interface AppBindings {
	Bindings: Env;
}

export type AppContext = Context<AppBindings>;
export type AppMiddleware = MiddlewareHandler<AppBindings>;
