import { jsonResponse } from "../utils/response";
import { getUserProfile } from "../services/profile";
import SteamID from "steamid";

const profileIdPattern = new URLPattern({ pathname: "/profile/id/:steamId" });
const profileVanityPattern = new URLPattern({
  pathname: "/profile/vanity/:vanityUrl",
});

export async function handleProfileVanity(req: Request): Promise<Response> {
  const url = new URL(req.url);

  const vanityMatch = profileVanityPattern.exec(url);

  if (!vanityMatch) {
    return jsonResponse({ error: "Invalid vanity URL" }, 400);
  }

  const vanityUrl = vanityMatch.pathname.groups.vanityUrl!;
  if (!vanityUrl) {
    return jsonResponse({ error: "Missing vanity URL" }, 400);
  }

  try {
    const profile = await getUserProfile(vanityUrl);
    return jsonResponse(profile);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function handleProfileById(req: Request): Promise<Response> {
  const url = new URL(req.url);

  const idMatch = profileIdPattern.exec(url);

  if (!idMatch) {
    return jsonResponse({ error: "Invalid ID URL" }, 400);
  }

  const steamId = idMatch.pathname.groups.steamId!;
  if (!steamId) {
    return jsonResponse({ error: "Missing steamid" }, 400);
  }

  try {
    const profile = await getUserProfile(new SteamID(steamId));
    return jsonResponse(profile);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}
