import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
});

const isDbAuthenticated = t.middleware(({ ctx, next }) => {
	if (!ctx.dbUser) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'User not found in database',
		});
	}

	return next({
		ctx: {
			...ctx,
			dbUser: ctx.dbUser,
		},
	});
});

const isFirebaseAuthenticated = t.middleware(({ ctx, next }) => {
	if (!ctx.firebaseUser) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to access this resource',
		});
	}

	return next({
		ctx: {
			...ctx,
			firebaseUser: ctx.firebaseUser,
		},
	});
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isFirebaseAuthenticated);
export const protectedSteamAuthedProcedure = t.procedure.use(isDbAuthenticated);
export const router = t.router;
