import { jsonResponse } from "../utils/response";
import { getMyInventory, getUserInventory } from "../services/inventory";
import { getUserProfile } from "../services/profile";

export async function handleInventoryMine(req: Request): Promise<Response> {
  try {
    const inventory = await getMyInventory();
    return jsonResponse(inventory);
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
}

const inventoryVanityPattern = new URLPattern({
  pathname: "/inventory/vanity/:vanityUrl",
});

export async function handleInventoryVanity(req: Request): Promise<Response> {
  const url = new URL(req.url);

  const vanityMatch = inventoryVanityPattern.exec(url);
  if (!vanityMatch) {
    return jsonResponse({ error: "Invalid vanity URL" }, 400);
  }

  const vanityUrl = vanityMatch.pathname.groups.vanityUrl!;
  if (!vanityUrl) {
    return jsonResponse({ error: "Missing vanity URL" }, 400);
  }

  try {
    const profile = await getUserProfile(vanityUrl);
    const steamId = profile.steamID.toString();

    try {
      const inventory = await getUserInventory(steamId);
      return jsonResponse(inventory);
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  } catch (err: any) {
    return jsonResponse({ error: "User not found" }, 404);
  }
}

const inventoryIdPattern = new URLPattern({
  pathname: "/inventory/id/:steamid",
});

export async function handleInventoryById(req: Request): Promise<Response> {
  const url = new URL(req.url);

  const idMatch = inventoryIdPattern.exec(url);

  if (!idMatch) {
    return jsonResponse({ error: "Invalid ID URL" }, 400);
  }

  const steamId = idMatch.pathname.groups.steamid;

  if (!steamId) {
    return jsonResponse({ error: "Missing steamid" }, 400);
  }

  try {
    const inventory = await getUserInventory(steamId);
    return jsonResponse(inventory);
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
}
