const STEAM_ID_OFFSET = 76561197960265728n; // BigInt needed for precision

export function partnerIdToSteamId(partnerId: string): string {
  return (BigInt(partnerId) + STEAM_ID_OFFSET).toString();
}

export function steamIdToPartnerId(steamId: string): string {
  return (BigInt(steamId) - STEAM_ID_OFFSET).toString();
}
