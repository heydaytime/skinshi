import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { useState } from "react";
import { auth } from "./firebase";
import type { AppRouter } from "@skinshi/api/router";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

const AUTH_WORKER_URL = process.env.EXPO_PUBLIC_AUTH_WORKER_URL || "https://auth.skinshi.com";

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
	if (!browserQueryClient) browserQueryClient = makeQueryClient();
	return browserQueryClient;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${AUTH_WORKER_URL}/trpc`,
					transformer: superjson,
					headers: async () => {
						const headers: Record<string, string> = {};
						const token = await auth.currentUser?.getIdToken();
						if (token) {
							headers.Authorization = `Bearer ${token}`;
						}
						return headers;
					},
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}
