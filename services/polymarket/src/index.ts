import { config } from "./config";
import { createRedisClient, closeRedisClient } from "./lib/redis";
import { startServer } from "./server";

// Track running state for graceful shutdown
let isShuttingDown = false;

export const rdb = createRedisClient(
  "polymarket-redis-client",
  config.redis.url,
);
async function main() {
  console.log("[Main] Starting skinshi-polymarket service...");

  startServer();

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      console.log("[Main] Shutdown already in progress...");
      return;
    }

    isShuttingDown = true;
    console.log(`\n[Main] Received ${signal}, shutting down gracefully...`);

    // Close main Redis connections
    await Promise.all([closeRedisClient(rdb, "writer")]);

    console.log("[Main] Shutdown complete");
    process.exit(0);
  };

  // Register shutdown handlers
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  console.log("[Main] Service started successfully");
  console.log("[Main] Press Ctrl+C to stop");
}

main().catch((err) => {
  console.error("[Main] Fatal error:", err);
  process.exit(1);
});
