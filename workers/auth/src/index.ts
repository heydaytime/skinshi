import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { cors } from 'hono/cors';
import { appRouter } from '@skinshi/api/router';
import { createContext } from './context';
import { authMiddleware } from './middleware/auth';
import { AppBindings } from './types/hono';
import { steamCallbackHandler } from './handlers/steam';

const app = new Hono<AppBindings>();

app.get('/auth/steam/callback', steamCallbackHandler);

// CORS middleware for development
app.use('/trpc/*', async (c, next) => {
	if (c.env.ENVIRONMENT === 'development') {
		return cors({ origin: '*' })(c, next);
	}
	return next();
});

// Auth middleware - runs BEFORE tRPC and verifies JWT
app.use('/trpc/*', authMiddleware);

// tRPC server - receives user from Hono context (already verified)
app.use(
	'/trpc/*',
	trpcServer({
		router: appRouter,
		createContext: async (_opts, c) => createContext(c),
	}),
);

export default app;
