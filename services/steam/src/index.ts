import { authenticate, getCookies } from "./steam/session";
import { initClient } from "./steam/client";
import { startServer } from "./server";
import { createRedisClient } from "./lib/redis";

export const rdb = createRedisClient("steam-redis-client");

await authenticate();
const cookies = await getCookies();
console.log("Got cookies!");

await initClient(cookies);
startServer();
