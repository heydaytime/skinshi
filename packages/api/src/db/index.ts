import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type DrizzleClient = ReturnType<typeof createDrizzle>;

export const createDrizzle = (d1: D1Database) => {
	return drizzle(d1, { schema });
};
