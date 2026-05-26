import { jwtVerify, createLocalJWKSet } from 'jose';
import { FirebaseJWKSResponseSchema, FirebaseUserSchema, type FirebaseUser, type FirebaseJWKSResponse } from '@skinshi/api/types';
import { config } from '@skinshi/api/config';

export async function verifyFirebaseToken(token: string, projectId: string, kv: KVNamespace): Promise<FirebaseUser | null> {
	const verifyOptions = {
		issuer: `https://securetoken.google.com/${projectId}`,
		audience: projectId,
		algorithms: ['RS256' as const],
	};

	try {
		const jwks = await getJWKS(kv);
		const JWKS = createLocalJWKSet(jwks);
		const { payload } = await jwtVerify(token, JWKS, verifyOptions);
		return FirebaseUserSchema.parse(payload);
	} catch (error) {
		const isMissingKey = error instanceof Error && error.name === 'JWKSNoMatchingKey';

		// Only refresh if the key is missing — could mean Firebase rotated keys.
		// Retry exactly once so a bad JWT can't force endless fetches.
		if (isMissingKey) {
			console.log('[Firebase Auth] Cached JWKS missing key, refreshing from Google...');
			try {
				const freshJwks = await fetchAndCacheJWKS(kv);
				const JWKS = createLocalJWKSet(freshJwks);
				const { payload } = await jwtVerify(token, JWKS, verifyOptions);
				return FirebaseUserSchema.parse(payload);
			} catch (retryError) {
				console.error('[Firebase Auth] JWT verification failed after JWKS refresh:', retryError);
				return null;
			}
		}

		console.error('[Firebase Auth] JWT verification failed:', error);
		console.error('[Firebase Auth] Project ID used:', projectId);
		return null;
	}
}

async function getJWKS(kv: KVNamespace): Promise<FirebaseJWKSResponse> {
	const cached = await kv.get(config.JWT_CACHE_KEY, 'text');
	if (cached) {
		return FirebaseJWKSResponseSchema.parse(JSON.parse(cached));
	}
	return fetchAndCacheJWKS(kv);
}

async function fetchAndCacheJWKS(kv: KVNamespace): Promise<FirebaseJWKSResponse> {
	const response = await fetch(config.FIREBASE_PUBLIC_KEYS_URL);
	const jwks = await response.json();

	await kv.put(config.JWT_CACHE_KEY, JSON.stringify(jwks), {
		expirationTtl: config.JWT_CACHE_TTL,
	});

	return FirebaseJWKSResponseSchema.parse(jwks);
}
