import { jsonResponse } from "../utils/response";
import { getCacheMarket, setCacheMarket } from "../services/cache";
import { fetchPolymarket, PolymarketApiError } from "../services/polymarket";
import { z } from "zod";

// example: http://localhost:8787/market/some-slug?id=123
const slugPattern = new URLPattern({ pathname: "/market/:slug" });

export async function handleGetMarket(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const match = slugPattern.exec(url);
  const slug = match?.pathname.groups.slug;
  const id = url.searchParams.get("id");

  if (!slug) {
    return jsonResponse({ error: "Missing slug parameter" }, 400);
  }

  if (!id) {
    return jsonResponse(
      { error: "Missing id query parameter" },
      400,
    );
  }

  try {
    let cachedMarket = await getCacheMarket(slug, id);

    if (cachedMarket) {
      return jsonResponse(cachedMarket);
    }

    const market = await fetchPolymarket(slug, id);

    // fire-and-forget caching
    setCacheMarket(slug, id, market).catch((error) => {
      console.error("[Market Handler] Error caching market data:", error);
    });

    return jsonResponse(market);
  } catch (error) {
    console.error(`[Market Handler] Error fetching market slug=${slug}, id=${id}:`, error);
    
    // Handle specific error types
    if (error instanceof PolymarketApiError) {
      return jsonResponse({ 
        error: "Polymarket API error", 
        message: error.message,
        slug: error.slug,
        status: error.status 
      }, error.status);
    }
    
    if (error instanceof z.ZodError) {
      return jsonResponse({ 
        error: "Schema validation failed", 
        message: "Market data does not match expected schema",
        issues: error.issues.map(i => ({ path: i.path, message: i.message }))
      }, 422);
    }
    
    return jsonResponse({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
}
