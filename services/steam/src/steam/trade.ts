import type { TradeRequest } from "../schemas/steam";
import { community, manager } from "./client";
import { myAuth } from "./session";
import TradeOffer from "steam-tradeoffer-manager/lib/classes/TradeOffer";

/**
 * @param tradeUrl - the full trade url of the RECIPENT
 * @param myAssets - our i.e. the bot's assets to send, if any
 * @param theirAssets - the recipient's assets to receive, if any
 *
 * Note: at least one of myAssets or theirAssets must be provided, otherwise the offer will be rejected by Steam.
 */
export async function sendTradeOffer(tradeRequest: TradeRequest) {
  const offer = manager.createOffer(tradeRequest.tradeUrl);
  tradeRequest.theirAssets?.forEach((asset) =>
    offer.addTheirItem(asset as any),
  );
  tradeRequest.myAssets?.forEach((asset) => offer.addMyItem(asset as any));
  offer.setMessage(tradeRequest.message);

  return await new Promise<string>((resolve, reject) => {
    offer.send((err, status) => {
      if (err) return reject(err);
      console.log("Offer sent, status:", status);

      if (status === "pending") {
        community.acceptConfirmationForObject(
          myAuth.identitySecret,
          offer.id,
          (err) => {
            if (err) return reject(err);
            console.log("Trade confirmed!");
            resolve("confirmed");
          },
        );
      } else {
        resolve("confirmed");
      }
    });
  });
}

export interface TradeOfferDetails {
  offerId: string;
  status: string;
  itemsToGive: Array<{
    appid: number;
    contextid: string;
    assetid: string;
    classid?: string;
    instanceid?: string;
  }>;
  itemsToReceive: Array<{
    appid: number;
    contextid: string;
    assetid: string;
    classid?: string;
    instanceid?: string;
  }>;
}

/**
 * Sends a trade offer and returns detailed information about the offer including items.
 * Use this when you need to know exactly what items were exchanged.
 * 
 * NOTE: This function fetches offer details from Steam API after confirmation.
 * Temporarily disabled for mock API compatibility - use sendTradeOfferWithSimpleDetails instead.
 */
/*
export async function sendTradeOfferWithDetails(
  tradeRequest: TradeRequest,
): Promise<TradeOfferDetails> {
  const offer = manager.createOffer(tradeRequest.tradeUrl);
  tradeRequest.theirAssets?.forEach((asset) =>
    offer.addTheirItem(asset as any),
  );
  tradeRequest.myAssets?.forEach((asset) => offer.addMyItem(asset as any));
  offer.setMessage(tradeRequest.message);

  return await new Promise<TradeOfferDetails>((resolve, reject) => {
    offer.send((err, status) => {
      if (err) return reject(err);
      console.log("Offer sent, status:", status);

      const handleConfirmation = () => {
        // Fetch the offer to get complete details
        manager.getOffer(offer.id!, (err, fetchedOffer) => {
          if (err) return reject(err);

          // Map items to our format
          const itemsToGive = fetchedOffer.itemsToGive.map((item) => ({
            appid: item.appid,
            contextid: String(item.contextid),
            assetid: String(item.assetid || item.id),
            classid: item.classid ? String(item.classid) : undefined,
            instanceid: item.instanceid ? String(item.instanceid) : undefined,
          }));

          const itemsToReceive = fetchedOffer.itemsToReceive.map((item) => ({
            appid: item.appid,
            contextid: String(item.contextid),
            assetid: String(item.assetid || item.id),
            classid: item.classid ? String(item.classid) : undefined,
            instanceid: item.instanceid ? String(item.instanceid) : undefined,
          }));

          resolve({
            offerId: fetchedOffer.id!,
            status: status === "pending" ? "confirmed" : "sent",
            itemsToGive,
            itemsToReceive,
          });
        });
      };

      if (status === "pending") {
        community.acceptConfirmationForObject(
          myAuth.identitySecret,
          offer.id,
          (err) => {
            if (err) return reject(err);
            console.log("Trade confirmed! Fetching offer details...");
            handleConfirmation();
          },
        );
      } else {
        handleConfirmation();
      }
    });
  });
}
*/

/**
 * Simplified version that returns the items we sent without fetching from Steam API.
 * Use this for mock API compatibility - returns the myAssets we already know about.
 */
export async function sendTradeOfferWithSimpleDetails(
  tradeRequest: TradeRequest,
): Promise<TradeOfferDetails> {
  const offer = manager.createOffer(tradeRequest.tradeUrl);
  tradeRequest.theirAssets?.forEach((asset) =>
    offer.addTheirItem(asset as any),
  );
  tradeRequest.myAssets?.forEach((asset) => offer.addMyItem(asset as any));
  offer.setMessage(tradeRequest.message);

  return await new Promise<TradeOfferDetails>((resolve, reject) => {
    offer.send((err, status) => {
      if (err) return reject(err);
      console.log("Offer sent, status:", status);

      const handleConfirmation = () => {
        // Use the items we sent instead of fetching from Steam
        const itemsToGive = (tradeRequest.myAssets || []).map((item) => ({
          appid: Number(item.appid),
          contextid: String(item.contextid),
          assetid: String(item.assetid),
          classid: undefined,
          instanceid: undefined,
        }));

        const itemsToReceive = (tradeRequest.theirAssets || []).map((item) => ({
          appid: Number(item.appid),
          contextid: String(item.contextid),
          assetid: String(item.assetid),
          classid: undefined,
          instanceid: undefined,
        }));

        resolve({
          offerId: offer.id!,
          status: status === "pending" ? "confirmed" : "sent",
          itemsToGive,
          itemsToReceive,
        });
      };

      if (status === "pending") {
        community.acceptConfirmationForObject(
          myAuth.identitySecret,
          offer.id,
          (err) => {
            if (err) return reject(err);
            console.log("Trade confirmed! Using local item details...");
            handleConfirmation();
          },
        );
      } else {
        handleConfirmation();
      }
    });
  });
}
