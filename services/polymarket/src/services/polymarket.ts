import { MarketSchema, type Market } from "../schemas/market";
import { z } from "zod";
import { config } from "../config";

/**
 * Custom error class for Polymarket API errors
 */
export class PolymarketApiError extends Error {
  constructor(
    public readonly slug: string,
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(`Polymarket API error for slug "${slug}": ${status} ${statusText}`);
    this.name = "PolymarketApiError";
  }
}

/**
 * Fetches all markets for a given event slug from Polymarket
 * @throws {PolymarketApiError} If the API returns a non-OK response
 * @throws {z.ZodError} If the response doesn't match the expected schema
 */
export async function fetchPolymarket(
  slug: string,
  id: string,
): Promise<Market> {
  const url = `${config.polymarket.baseUrl}/events?slug=${encodeURIComponent(slug)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new PolymarketApiError(slug, res.status, res.statusText);
  }

  const data = (await res.json()) as unknown as { markets: unknown[] }[];

  if (!data || data.length === 0 || !data[0]) {
    console.warn(`[Polymarket] No event found for slug: ${slug}`);
    throw new PolymarketApiError(
      slug,
      404,
      `No event found for slug "${slug}"`,
    );
  }

  const { markets } = data[0];
  const validatedMarkets = z.array(MarketSchema).parse(markets);

  for (const market of validatedMarkets) {
    if (market.id === id) {
      return market;
    }
  }

  throw new PolymarketApiError(
    slug,
    404,
    `Market with id "${id}" not found for slug "${slug}"`,
  );
}

/**
 * Fetches multiple markets in parallel using Promise.all
 * @param requests Array of {slug, id} pairs to fetch
 * @returns Array of Market objects
 * @throws {PolymarketApiError} If any API call fails
 * @throws {z.ZodError} If any response doesn't match the expected schema
 */
export async function fetchMultiplePolymarket(
  requests: Array<{ slug: string; id: string }>,
): Promise<Market[]> {
  const promises = requests.map(({ slug, id }) => fetchPolymarket(slug, id));
  return Promise.all(promises);
}
