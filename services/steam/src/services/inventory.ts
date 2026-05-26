import { manager } from "../steam/client";
import { CasesOnlyInventorySchema, InventorySchema, type Inventory } from "../schemas/steam";
import { cacheResult, getCacheResult } from "./cache";
import { REDIS_KEYS } from "../config";

/**
 * @param steamId - MUST be a 64-bit steamid, not a vanity url!
 */
export async function getUserInventory(
  steamId: string,
  appid = 730,
  contextid = 2,
  tradableOnly = true,
): Promise<Inventory> {
  const key = REDIS_KEYS.inventory(steamId);

  const cachedInventory = await getCacheResult(key);

  if (cachedInventory) {
    try {
      return InventorySchema.parse(cachedInventory);
    } catch (error) {
      console.error(
        `Cached inventory for SteamID ${steamId} failed validation:`,
        error,
      );
    }
  }

  try {
    const fetchedInventory = CasesOnlyInventorySchema.parse(
      await new Promise<any>((resolve, reject) => {
        manager.getUserInventoryContents(
          steamId,
          appid,
          contextid,
          tradableOnly,
          (err, inventory) => {
            if (err) return reject(err);
            resolve({ items: inventory });
          },
        );
      }),
    );

    cacheResult(key, fetchedInventory).catch((error) =>
      console.error(`Failed to cache inventory for SteamID ${steamId}:`, error),
    );

    return fetchedInventory;
  } catch (error) {
    console.error(`Failed to fetch inventory for SteamID ${steamId}:`, error);
    throw new Error("Failed to fetch user inventory");
  }
}

export async function getMyInventory(
  appid = 730,
  contextid = 2,
  tradableOnly = true,
): Promise<Inventory> {
  const steamId = manager.steamID?.getSteamID64();
  if (!steamId) {
    throw new Error("Steam client not logged in");
  }

  const key = REDIS_KEYS.inventory(steamId);

  const cachedInventory = await getCacheResult(key);

  if (cachedInventory) {
    try {
      return InventorySchema.parse(cachedInventory);
    } catch (error) {
      console.error(`Cached my inventory failed validation:`, error);
    }
  }

  try {
    const fetchedInventory = CasesOnlyInventorySchema.parse(
      await new Promise<any>((resolve, reject) => {
        manager.getInventoryContents(
          appid,
          contextid,
          tradableOnly,
          (err: Error | null, inventory: any[]) => {
            if (err) return reject(err);
            resolve({ items: inventory });
          },
        );
      }),
    );

    cacheResult(key, fetchedInventory).catch((error) =>
      console.error(`Failed to cache my inventory:`, error),
    );

    return fetchedInventory;
  } catch (error) {
    console.error(`Failed to fetch my inventory:`, error);
    throw new Error("Failed to fetch my inventory");
  }
}
