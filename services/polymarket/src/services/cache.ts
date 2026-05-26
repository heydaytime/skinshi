import superjson from "superjson";
import type { Market } from "../schemas/market";
import { config, REDIS_KEYS } from "../config";
import { rdb } from "..";

export async function setCacheMarket(
  slug: string,
  id: string,
  market: Market,
): Promise<void> {
  try {
    const key = REDIS_KEYS.DATA_SLUG_ID(slug, id);

    if ((await rdb.set(key, superjson.stringify(market))) != "OK") {
      console.warn(
        `[Cache] Warning: Failed to cache market data for key ${key}`,
      );
    }

    if ((await rdb.expire(key, config.redis.ttl)) !== 1) {
      console.warn(`[Cache] Warning: Failed to set TTL for key ${key}`);
    }
  } catch (error) {
    console.error("[Cache] Error caching market data:", error);
  }
}

export async function getCacheMarket(
  slug: string,
  id: string,
): Promise<Market | null> {
  try {
    const key = REDIS_KEYS.DATA_SLUG_ID(slug, id);

    const cached = await rdb.get(key);
    if (cached) {
      return superjson.parse(cached);
    }
  } catch (error) {
    console.error("[Cache] Error retrieving cached market data:", error);
  }
  return null;
}

// Generic hash-based caching for batch requests
export async function setCacheByHash<T>(hash: string, data: T): Promise<void> {
  try {
    const key = REDIS_KEYS.DATA_HASH(hash);

    if ((await rdb.set(key, superjson.stringify(data))) != "OK") {
      console.warn(`[Cache] Warning: Failed to cache data for hash ${hash}`);
    }

    if ((await rdb.expire(key, config.redis.ttl)) !== 1) {
      console.warn(`[Cache] Warning: Failed to set TTL for hash ${hash}`);
    }
  } catch (error) {
    console.error("[Cache] Error caching data by hash:", error);
  }
}

export async function getCacheByHash<T>(hash: string): Promise<T | null> {
  try {
    const key = REDIS_KEYS.DATA_HASH(hash);

    const cached = await rdb.get(key);
    if (cached) {
      return superjson.parse(cached);
    }
  } catch (error) {
    console.error("[Cache] Error retrieving cached data by hash:", error);
  }
  return null;
}
