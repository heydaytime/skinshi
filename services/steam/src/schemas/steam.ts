import { z } from "zod";
import { partnerIdToSteamId } from "../utils/utils";
import { VALID_CASE_CLASS_IDS } from "../constants/cases";

export const SteamAuthSchema = z.object({
  username: z.string(),
  password: z.string(),
  identitySecret: z.string(),
  sharedSecret: z.string(),
  refreshToken: z.string().optional(),
});

export type SteamAuth = z.infer<typeof SteamAuthSchema>;

export const InventoryAssetSchema = z.object({
  appid: z.coerce.string().default("730"),
  contextid: z.coerce.string().default("2"),
  assetid: z.coerce.string(),
  classid: z.coerce.string(),
  instanceid: z.coerce.string(),
  icon_url: z.string(),
  background_color: z.string(),
  name: z.string().default("Unknown Name"),
});

export type InventoryAsset = z.infer<typeof InventoryAssetSchema>;

export const InventorySchema = z.object({
  items: z.array(InventoryAssetSchema),
});

export type Inventory = z.infer<typeof InventorySchema>;

// Schema that filters inventory to only include valid CS2 cases
// Uses transform to filter at parse time - only cases are stored in cache
export const CasesOnlyInventorySchema = InventorySchema.transform((data) => ({
  items: data.items.filter((item) => VALID_CASE_CLASS_IDS.has(item.classid)),
}));

export const SteamProfileSchema = z.object({
  name: z.string(),
  onlineState: z.string(),
  stateMessage: z.string(),
  privacyState: z.string(),
  visibilityState: z.string(),
  avatarHash: z.string(),
  vacBanned: z.boolean(),
  tradeBanState: z.string(),
  isLimitedAccount: z.boolean(),
  customURL: z.string(),
  memberSince: z.coerce.string(),
  location: z.string(),
  realName: z.string(),
  summary: z.string(),
  steamID: z.union([
    z
      .object({ accountid: z.number() })
      .transform((obj) => partnerIdToSteamId(obj.accountid.toString())),
    z.string(),
  ]),
});

export type SteamProfile = z.infer<typeof SteamProfileSchema>;

export const TradeAssetSchema = InventoryAssetSchema.pick({
  appid: true,
  contextid: true,
  assetid: true,
});

export const TradeRequestSchema = z.object({
  tradeUrl: z.url(),
  message: z.string().default("Here's a trade offer!"),
  myAssets: z.array(TradeAssetSchema).optional(),
  theirAssets: z.array(TradeAssetSchema).optional(),
});

export type TradeRequest = z.infer<typeof TradeRequestSchema>;

export const TradeSendCasesRequestSchema = z.object({
  tradeUrl: z.string().url(),
  caseCount: z.coerce.number().int().positive(),
});

export type TradeSendCasesRequest = z.infer<typeof TradeSendCasesRequestSchema>;
