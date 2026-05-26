import { handleGetMarket } from "./market";
import { handleGetMarkets } from "./markets";

export async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(`[Router] Received request: ${req.method} ${url}`);

  if (req.method === "GET" && path.startsWith("/market"))
    return handleGetMarket(req);

  if (req.method === "POST" && path === "/markets")
    return handleGetMarkets(req);

  return Response.json({ error: "Not found" }, { status: 404 });
}
