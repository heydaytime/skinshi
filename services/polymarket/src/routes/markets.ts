import { jsonResponse, parseJsonBody } from "../utils/response";
import { getCacheByHash, setCacheByHash } from "../services/cache";
import { fetchMultiplePolymarket, PolymarketApiError } from "../services/polymarket";
import type { Market } from "../schemas/market";
import { z } from "zod";
import superjson from "superjson";

// Request validation schema
const BatchRequestSchema = z.array(
  z.object({
    slug: z.string(),
    id: z.string(),
  })
);

// Simple hash function for the raw JSON body
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function handleGetMarkets(req: Request): Promise<Response> {
  // Get raw body text
  const rawBody = await req.text();

  if (!rawBody) {
    return jsonResponse({ error: "Missing request body" }, 400);
  }

  try {
    // Hash the raw body for cache key
    const bodyHash = await hashString(rawBody);

    // Check cache first using the hash
    const cachedMarkets = await getCacheByHash<Market[]>(bodyHash);
    if (cachedMarkets) {
      return jsonResponse(cachedMarkets);
    }

    // Parse and validate the request body (superjson)
    let parsedBody: unknown;
    try {
      parsedBody = superjson.parse(rawBody);
    } catch {
      return jsonResponse({ error: "Invalid superjson in request body" }, 400);
    }

    const validationResult = BatchRequestSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      return jsonResponse(
        {
          error: "Invalid request body",
          issues: validationResult.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        400
      );
    }

    const requests = validationResult.data;

    if (requests.length === 0) {
      return jsonResponse({ error: "Empty request array" }, 400);
    }

    // Fetch all markets in parallel
    const markets = await fetchMultiplePolymarket(requests);

    // Cache the results with the hash key
    setCacheByHash(bodyHash, markets).catch((error) => {
      console.error("[Markets Handler] Error caching markets data:", error);
    });

    return jsonResponse(markets);
  } catch (error) {
    console.error("[Markets Handler] Error fetching markets:", error);

    // Handle specific error types
    if (error instanceof PolymarketApiError) {
      return jsonResponse(
        {
          error: "Polymarket API error",
          message: error.message,
          slug: error.slug,
          status: error.status,
        },
        error.status
      );
    }

    if (error instanceof z.ZodError) {
      return jsonResponse(
        {
          error: "Schema validation failed",
          message: "Market data does not match expected schema",
          issues: error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        422
      );
    }

    return jsonResponse(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}
