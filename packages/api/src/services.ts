import { TRPCError } from '@trpc/server';
import superjson from 'superjson';

export async function fetchFromMicroservice<T>(url: string, errorMessage: string): Promise<T> {
	console.log(`[fetchFromMicroservice] Fetching: ${url}`);
	return fetch(url)
		.then(async (res) => {
			const text = await res.text();
			console.log(`[fetchFromMicroservice] Response status: ${res.status}, body preview:`, text.substring(0, 200));

			let data: Record<string, unknown>;
			try {
				data = superjson.parse(text) as Record<string, unknown>;
			} catch (parseError) {
				console.error(`[fetchFromMicroservice] Failed to parse superjson:`, parseError);
				console.error(`[fetchFromMicroservice] Raw response:`, text);
				throw new Error(`Failed to parse response from microservice: ${parseError}`);
			}

			if (!res.ok) {
				console.error(`[Microservice Error] ${url} returned ${res.status}:`, data);
				const errorDetail = data.message || data.error || `Status ${res.status}`;
				throw new Error(`${errorMessage}: ${errorDetail}`);
			}

			console.log(`[fetchFromMicroservice] Parsed data successfully for ${url}`);
			return data as T;
		})
		.catch((error) => {
			if (error instanceof TRPCError) {
				throw error;
			}
			console.error(`${errorMessage}:`, error);
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: error instanceof Error ? error.message : errorMessage,
			});
		});
}

export async function postToMicroservice<T>(url: string, body: unknown, errorMessage: string): Promise<T> {
	return fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: superjson.stringify(body),
	})
		.then(async (res) => {
			const text = await res.text();
			const data = superjson.parse(text) as Record<string, unknown>;
			if (!res.ok) {
				throw new Error((data.error as string) || `Microservice responded with status ${res.status}`);
			}
			return data as T;
		})
		.catch((error) => {
			console.error(`${errorMessage}:`, error);
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: errorMessage,
			});
		});
}
