import type { Context } from 'hono';
import { createDrizzle } from '@skinshi/api/db';
import type { TRPCContext } from '@skinshi/api/context';
import type { DbUser } from '@skinshi/api/db/schema';
import type { FirebaseUser } from '@skinshi/api/types';

export const createContext = async (honoContext: Context): Promise<TRPCContext> => {
	const dbUser = honoContext.get('dbUser') as DbUser | null;
	const firebaseUser = honoContext.get('firebaseUser') as FirebaseUser | null;
	const env = honoContext.env;
	const isAdmin = honoContext.req.header('X-Admin-Secret') === 'neovim';

	return {
		env,
		drizzle: createDrizzle(env.db),
		dbUser,
		firebaseUser,
		isAdmin,
	};
};
