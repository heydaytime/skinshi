import { config } from "./config";
import { router } from "./routes";

export function startServer() {
  const server = Bun.serve({
    port: config.port || 8000,
    fetch: router,
  });
  console.log(`HTTP server running on port ${server.port}`);
}
