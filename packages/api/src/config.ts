export const config = {
	JWT_CACHE_KEY: 'firebase:jwks',
	JWT_CACHE_TTL: 60 * 60, // 1 hour in seconds for KV
	FIREBASE_PUBLIC_KEYS_URL: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',

	STEAM_OPENID_URL: 'https://steamcommunity.com/openid/login',
	STATE_EXPIRATION_SECONDS: 60, // 1 minute

	STEAM_AUTH_PENDING_KEY: (userId: string) => `steam_auth_pending:${userId}`,
	STEAM_AUTH_STATE_KEY: (state: string) => `steam_auth:${state}`,
} as const;
