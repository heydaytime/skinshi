import superjson from "superjson";
import { rdb } from "..";
import { config } from "../config";

export async function getCacheResult(key: string) {
  try {
    const result = await rdb.get(key);
    if (result) return superjson.parse(result);
    return null;
  } catch (error) {
    console.error(`Error retrieving cache for key ${key}:`, error);
  }
}

export async function cacheResult(key: string, value: any) {
  try {
    if ((await rdb.set(key, superjson.stringify(value))) !== "OK") {
      console.warn(`Failed to cache result for key ${key}`);
    }

    if ((await rdb.expire(key, config.redis.ttl)) !== 1)
      console.warn(`Failed to set TTL for key ${key}`);
  } catch (error) {
    console.error(`Error caching result for key ${key}:`, error);
  }
}
