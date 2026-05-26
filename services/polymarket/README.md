# skinshi-polymarket

A microservice that polls Polymarket's Gamma API and stores market data in Redis. Designed to be consumed by the Skinshi Go backend.

## Quick Start

```bash
# Install dependencies
bun install

# Run (requires REDIS_URL)
REDIS_URL=redis://localhost:6379 bun run src/index.ts

# Or use make
make run
```

## Environment Variables

| Variable             | Required | Default                            | Description                                              |
| -------------------- | -------- | ---------------------------------- | -------------------------------------------------------- |
| `REDIS_URL`          | Yes      | -                                  | Redis connection string (e.g., `redis://localhost:6379`) |
| `RETRY_DELAY_MS`     | No       | `5000`                             | Base delay for retry backoff (milliseconds)              |
| `MAX_RETRIES`        | No       | `3`                                | Max consecutive failures before waiting full interval    |
| `POLYMARKET_API_URL` | No       | `https://gamma-api.polymarket.com` | Polymarket API base URL                                  |

## Graceful Shutdown

The service handles `SIGINT` and `SIGTERM` signals gracefully:

- Stops polling loop
- Closes Redis connections
- Exits cleanly

```bash
# Send SIGINT (Ctrl+C) or SIGTERM
kill -SIGTERM <pid>
```

---

## Development

```bash
# Type check
bunx tsc --noEmit

# Run with debug logging
REDIS_URL=redis://localhost:6379 POLLING_INTERVAL_MS=10000 bun run src/index.ts
```
