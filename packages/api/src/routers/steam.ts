import { protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import { users } from "../db/schema";
import { config } from "../config";
import z from "zod";
import {
  InventorySchema,
  SteamProfileSchema,
  type SteamProfile,
} from "@skinshi/steam-service/schemas";
import { fetchFromMicroservice } from "../services";

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const profile = publicProcedure
  .input(
    z.union([
      z.object({ type: z.literal("id"), steamId: z.string() }),
      z.object({ type: z.literal("vanity"), vanityUrl: z.string() }),
    ]),
  )
  .output(SteamProfileSchema)
  // @ts-ignore - TRPC doesnt understand the union input properly
  .query(async ({ input, ctx }) => {
    console.log("Fetching Steam profile with input:", input);
    if (input.type === "id") {
      const url = `${ctx.env.STEAM_SERVICE_URL}/profile/id/${input.steamId}`;
      return fetchFromMicroservice<SteamProfile>(
        url,
        "Failed to fetch Steam profile by id",
      );
    } else if (input.type === "vanity") {
      const url = `${ctx.env.STEAM_SERVICE_URL}/profile/vanity/${input.vanityUrl}`;
      return fetchFromMicroservice<SteamProfile>(
        url,
        "Failed to fetch Steam profile by vanity url",
      );
    }
  });

export const inventory = publicProcedure
  .input(
    z.union([
      z.object({ type: z.literal("id"), steamId: z.string() }),
      z.object({ type: z.literal("vanity"), vanityUrl: z.string() }),
    ]),
  )
  .output(InventorySchema)
  // @ts-ignore - TRPC doesnt understand the union input properly
  .query(async ({ input, ctx }) => {
    console.log("Fetching Steam inventory with input:", input);
    if (input.type === "id") {
      const url = `${ctx.env.STEAM_SERVICE_URL}/inventory/id/${input.steamId}`;
      return fetchFromMicroservice(
        url,
        "Failed to fetch Steam inventory by id",
      );
    } else if (input.type === "vanity") {
      const url = `${ctx.env.STEAM_SERVICE_URL}/inventory/vanity/${input.vanityUrl}`;
      return fetchFromMicroservice(
        url,
        "Failed to fetch Steam inventory by vanity url",
      );
    }
  });

export const initiate = protectedProcedure.query(async ({ ctx }) => {
  const existingUser = await ctx.drizzle
    .select()
    .from(users)
    .where(eq(users.userId, ctx.firebaseUser.user_id))
    .get();

  if (existingUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Steam account already linked to this account",
    });
  }

  const pendingKey = config.STEAM_AUTH_PENDING_KEY(ctx.firebaseUser.user_id);
  const existingState = await ctx.env.cache.get(pendingKey);

  if (existingState) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Steam authentication already in progress",
    });
  }

  const state = generateState();
  const stateKey = config.STEAM_AUTH_STATE_KEY(state);

  await ctx.env.cache.put(stateKey, superjson.stringify(ctx.firebaseUser), {
    expirationTtl: config.STATE_EXPIRATION_SECONDS,
  });

  await ctx.env.cache.put(pendingKey, state, {
    expirationTtl: config.STATE_EXPIRATION_SECONDS,
  });

  const backendUrl = ctx.env.BACKEND_URL || "http://localhost:8000";
  const returnTo = `${backendUrl}/auth/steam/callback?state=${state}`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": backendUrl,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const steamUrl = `${config.STEAM_OPENID_URL}?${params.toString()}`;

  return {
    state,
    redirectUrl: steamUrl,
  };
});
