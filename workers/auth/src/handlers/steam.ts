import { Context } from 'hono';
import superjson from 'superjson';
import { createDrizzle } from '@skinshi/api/db';
import { AppBindings } from '../types/hono';
import { users } from '@skinshi/api/db/schema';
import { verifySteamAuthentication } from '../auth/steam';
import { FirebaseUserSchema, type FirebaseUser } from '@skinshi/api/types';
import { config } from '@skinshi/api/config';

export const steamCallbackHandler = async (c: Context<AppBindings>) => {
	const db = createDrizzle(c.env.db);
	const query = c.req.query();
	const state = query.state;

	if (!state) {
		return c.json({ error: 'Missing state parameter' }, 400);
	}

	if (query['openid.mode'] === 'error') {
		return c.json({ error: 'Steam authentication failed', details: query['openid.error'] }, 400);
	}

	const claimedId = query['openid.claimed_id'] as string;
	const match = claimedId?.match(/https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)/);
	const steamId = match?.[1];
	console.log('Extracted Steam ID:', steamId);

	if (!steamId) {
		return c.json({ error: 'Could not extract Steam ID' }, 400);
	}

	const storedState = await c.env.cache.get(config.STEAM_AUTH_STATE_KEY(state));

	if (!storedState) {
		return c.json({ error: 'Invalid or expired state' }, 400);
	}

	await c.env.cache.delete(config.STEAM_AUTH_STATE_KEY(state));

	let user: FirebaseUser | null = null;
	try {
		user = FirebaseUserSchema.parse(superjson.parse(storedState));
	} catch {
		console.error('Invalid state data format:', storedState);
		return c.json({ error: 'Invalid state data format' }, 400);
	}

	const isValid = await verifySteamAuthentication(query);
	if (!isValid) {
		return c.json({ error: 'Invalid Steam authentication' }, 401);
	}

	try {
		const createdUser = await db
			.insert(users)
			.values({
				steamId: steamId,
				userId: user.user_id,
				email: user.email,
			})
			.returning()
			.get();

		console.log('Steam authentication successful for user:', createdUser);

		const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:3000';
		return c.redirect(`${frontendUrl}/success`);
	} catch (error) {
		console.error('Error inserting user into database:', error);
		return c.json({ error: 'Database error' }, 500);
	}
};
