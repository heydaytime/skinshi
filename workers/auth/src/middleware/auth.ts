import { verifyFirebaseToken } from '../auth';
import { createDrizzle } from '@skinshi/api/db';
import { DbUser, users } from '@skinshi/api/db/schema';
import { FirebaseUser } from '@skinshi/api/types';
import { AppMiddleware } from '../types/hono';
import { eq } from 'drizzle-orm';

export const authMiddleware: AppMiddleware = async (c, next) => {
	const authHeader = c.req.header('Authorization');

	if (!authHeader) {
		c.set('firebaseUser', null);
		c.set('dbUser', null);
		await next();
		return;
	}

	let firebaseUser: FirebaseUser | null = null;
	let dbUser: DbUser | null = null;

	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.slice('Bearer '.length);
		firebaseUser = await verifyFirebaseToken(token, c.env.FIREBASE_PROJECT_ID, c.env.cache);

		if (firebaseUser) {
			const db = createDrizzle(c.env.db);
			dbUser = (await db.select().from(users).where(eq(users.email, firebaseUser.email)).get()) ?? null;
		}
	}

	c.set('firebaseUser', firebaseUser);
	c.set('dbUser', dbUser);
	await next();
};
