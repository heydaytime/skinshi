import z from "zod";
import { InventoryAssetSchema } from "@skinshi/steam-service/schemas";

export const PlaceBetSchema = z.object({
  slug: z.string(),
  id: z.string(),
  marketOutcome: z.number(),
  tradeUrl: z.url(),
  message: z.string().default("Here's my bet!"),
  items: z.array(InventoryAssetSchema),
});

export type PlaceBet = z.infer<typeof PlaceBetSchema>;

export const BetItemSchema = z.object({
  classid: z.string(),
  assetid: z.string(),
});

export const BetTransactionSchema = z.object({
  botSteamId: z.string(),
  clientSteamId: z.string(),
  items: z.array(BetItemSchema),
});

export const BetSchema = z.object({
  steamId: z.string(),
  marketId: z.string(),
  marketOutcome: z.number(),
  buyIn: BetTransactionSchema,
  payout: BetTransactionSchema.nullable(),
  status: z.enum(["active", "payout_pending", "lost", "cancelled", "paid"]),
  createdAt: z.number(),
  resolvedAt: z.number().nullable(),
});

export type Bet = z.infer<typeof BetSchema>;

export const ClaimPayoutSchema = z.object({
  marketId: z.string(),
  tradeUrl: z.url(),
});

export type ClaimPayout = z.infer<typeof ClaimPayoutSchema>;
