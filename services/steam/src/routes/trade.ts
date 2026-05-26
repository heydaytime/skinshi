import type z from "zod";
import { jsonResponse, parseJsonBody } from "../utils/response";
import {
  TradeRequestSchema,
  TradeSendCasesRequestSchema,
  type Inventory,
} from "../schemas/steam";
import { sendTradeOffer, sendTradeOfferWithSimpleDetails } from "../steam/trade";
import { getMyInventory } from "../services/inventory";

export async function handleTradeSend(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await parseJsonBody<unknown>(req);
  } catch {
    return jsonResponse({ error: "Invalid superjson in request body" }, 400);
  }

  let tradeRequest: z.infer<typeof TradeRequestSchema>;
  try {
    tradeRequest = TradeRequestSchema.parse(body);
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 400);
  }

  if (
    (!tradeRequest.myAssets || tradeRequest.myAssets.length === 0) &&
    (!tradeRequest.theirAssets || tradeRequest.theirAssets.length === 0)
  ) {
    return jsonResponse(
      { error: "At least one of myAssets or theirAssets must be provided" },
      400,
    );
  }

  try {
    await sendTradeOffer(tradeRequest);
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }

  return jsonResponse({ ok: true });
}

export async function handleTradeSendCases(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await parseJsonBody<unknown>(req);
  } catch {
    return jsonResponse({ error: "Invalid superjson in request body" }, 400);
  }

  let sendRequest: z.infer<typeof TradeSendCasesRequestSchema>;
  try {
    sendRequest = TradeSendCasesRequestSchema.parse(body);
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 400);
  }

  // Fetch bot's inventory
  let myInventory: Inventory;
  try {
    myInventory = await getMyInventory();
  } catch (err: any) {
    return jsonResponse(
      { error: "Failed to fetch inventory: " + err.message },
      500,
    );
  }

  const availableCases = myInventory.items.length;
  const requestedCases = sendRequest.caseCount;

  if (availableCases < requestedCases) {
    return jsonResponse(
      {
        error: `have ${availableCases} cases but asked for ${requestedCases} cases, insufficient cases`,
      },
      400,
    );
  }

  // Select the first 'caseCount' cases from inventory
  const casesToSend = myInventory.items
    .slice(0, requestedCases)
    .map((item) => ({
      appid: item.appid,
      contextid: item.contextid,
      assetid: item.assetid,
    }));

  // Send the trade offer with simple details (returns items we sent, doesn't fetch from Steam)
  try {
    const offerDetails = await sendTradeOfferWithSimpleDetails({
      tradeUrl: sendRequest.tradeUrl,
      message: `Sending ${requestedCases} case(s)`,
      myAssets: casesToSend,
    });

    return jsonResponse({
      ok: true,
      offerId: offerDetails.offerId,
      status: offerDetails.status,
      casesSent: requestedCases,
      items: offerDetails.itemsToGive.map((item) => ({
        classid: item.classid || "",
        assetid: String(item.assetid),
      })),
    });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
}
