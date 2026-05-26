import { RedisClient } from "bun";
import { config } from "../config";

/**
 * Creates a new Redis client with logging
 * @param owner - Identifier for logging purposes
 * @param url - Redis connection URL. If not provided, uses config.redis.url
 * @returns A configured RedisClient instance
 */
export function createRedisClient(owner: string, url?: string): RedisClient {
  const client = new RedisClient(url ?? config.redis.url);

  client.onconnect = () => {
    console.log(`[Redis:${owner}] Connected successfully`);
  };

  client.onclose = (error) => {
    if (error) {
      console.error(`[Redis:${owner}] Connection closed with error:`, error);
    } else {
      console.log(`[Redis:${owner}] Connection closed gracefully`);
    }
  };

  return client;
}

/**
 * Gracefully closes a Redis client by closing the connection
 */
export async function closeRedisClient(
  client: RedisClient,
  owner: string,
): Promise<void> {
  try {
    // Bun's RedisClient uses close() method
    client.close();
    console.log(`[Redis:${owner}] Closed successfully`);
  } catch (error) {
    console.error(`[Redis:${owner}] Error during close:`, error);
  }
}
