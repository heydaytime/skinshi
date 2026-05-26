import { router } from './trpc';
import { addMarket, deleteMarket, resolveMarket, syncBets } from './routers/admin';
import { trade, claimPayout } from './routers/bet';
import { allMarkets, market } from './routers/polymarket';
import { initiate, inventory, profile } from './routers/steam';
import { helloProcedure, meProcedure, myInventory, myProfile, myBets } from './routers/user';

export const appRouter = router({
	hello: helloProcedure,
	me: meProcedure,
	user: router({
		profile: myProfile,
		inventory: myInventory,
		bets: myBets,
	}),
	steam: router({
		initiate,
		profile,
		inventory,
	}),
	polymarket: router({
		market,
		allMarkets,
	}),
	bet: router({
		trade,
		claimPayout,
	}),
	admin: router({
		addMarket,
		resolveMarket,
		deleteMarket,
		syncBets,
	}),
});

export type AppRouter = typeof appRouter;
