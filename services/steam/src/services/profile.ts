import CSteamUser from "steamcommunity/classes/CSteamUser";
import { community } from "../steam/client";
import type SteamCommunity from "steamcommunity";
import SteamID from "steamid";
import { SteamProfileSchema, type SteamProfile } from "../schemas/steam";
import { cacheResult, getCacheResult } from "./cache";
import { REDIS_KEYS } from "../config";

/**
 * @param steamId - can be either a SteamID object or a vanity url
 */
export async function getUserProfile(
  steamId: SteamID | string,
): Promise<SteamProfile> {
  const cachedProfile = await getCacheResult(
    REDIS_KEYS.profile(steamId.toString()),
  );

  if (cachedProfile) {
    try {
      return SteamProfileSchema.parse(cachedProfile);
    } catch (error) {
      console.error(
        `Cached profile for SteamID ${steamId} failed validation:`,
        error,
      );
    }
  }

  try {
    const fetchedProfile = SteamProfileSchema.parse(
      await new Promise<CSteamUser>((resolve, reject) => {
        community.getSteamUser(
          steamId as any,
          (err: SteamCommunity.CallbackError, user: CSteamUser) => {
            if (err) return reject(err);
            return resolve(user);
          },
        );
      }),
    );

    cacheResult(REDIS_KEYS.profile(steamId.toString()), fetchedProfile).catch(
      (error) =>
        console.error(`Failed to cache profile for SteamID ${steamId}:`, error),
    );

    return fetchedProfile;
  } catch (error) {
    console.error(`Failed to fetch profile for SteamID ${steamId}:`, error);
    throw new Error("Failed to fetch user profile");
  }
}
