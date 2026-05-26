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
  port: Number(optionalEnv("PORT", "8001")),
  redis: {
    url: optionalEnv("REDIS_URL", "redis://localhost:6379"),
    ttl: Number(optionalEnv("DATA_TTL_SECONDS", "100")), // seconds
    maxRetries: Number(optionalEnv("MAX_RETRIES", "3")),
    retryDelayMs: Number(optionalEnv("RETRY_DELAY_MS", "5000")),
  },
} as const;

// Redis key patterns
export const REDIS_KEYS = {
  profile: (id: string) => `profile:${id}`,
  inventory: (id: string) => `inventory:${id}`,
} as const;

export type Config = typeof config;
