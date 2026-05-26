import {
  handleInventoryMine,
  handleInventoryById,
  handleInventoryVanity,
} from "./inventory";
import { handleTradeSend, handleTradeSendCases } from "./trade";
import { handleProfileById, handleProfileVanity } from "./profile";
import { jsonResponse } from "../utils/response";

export async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(`Received request: ${req.method} ${path}`);

  if (req.method === "GET" && path === "/inventory/mine")
    return handleInventoryMine(req);

  if (req.method === "GET" && path.startsWith("/inventory/vanity"))
    return handleInventoryVanity(req);

  if (req.method === "GET" && path.startsWith("/inventory/id"))
    return handleInventoryById(req);

  if (req.method === "GET" && path.startsWith("/profile/vanity"))
    return handleProfileVanity(req);

  if (req.method === "GET" && path.startsWith("/profile/id"))
    return handleProfileById(req);

  if (req.method === "POST" && path === "/trade/request")
    return handleTradeSend(req);

  if (req.method === "POST" && path === "/trade/send")
    return handleTradeSendCases(req);

  return jsonResponse({ error: "Not found" }, 404);
}
