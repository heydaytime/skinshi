/**
 * Application configuration with environment variable validation
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[FATAL] Required environment variable ${name} is not set`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const config = {
  port: Number(optionalEnv("PORT", "8002")),
  redis: {
    url: optionalEnv("REDIS_URL", "redis://localhost:6379"),
    ttl: Number(optionalEnv("DATA_TTL_SECONDS", "100")), // seconds
    retryDelayMs: Number(optionalEnv("RETRY_DELAY_MS", "5000")),
    maxRetries: Number(optionalEnv("MAX_RETRIES", "3")),
  },
  polymarket: {
    baseUrl: optionalEnv(
      "POLYMARKET_API_URL",
      "https://gamma-api.polymarket.com",
    ),
  },
} as const;

// Redis key patterns
export const REDIS_KEYS = {
  DATA_SLUG_ID: (slug: string, id: string) => `markets:slug:${slug}:id:${id}`,
  DATA_HASH: (hash: string) => `markets:hash:${hash}`,
} as const;

export type Config = typeof config;
