import { z } from "zod";

const MarketResolutionStateSchema = z.enum(["inprogress", "yes", "no"]);

export type MarketResolutionState = z.infer<typeof MarketResolutionStateSchema>;

const normalizeUmaResolutionStatus = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === "string") ?? null;
  }

  if (typeof value === "string") {
    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        return normalizeUmaResolutionStatus(JSON.parse(value));
      } catch {
        return value;
      }
    }

    return value;
  }

  return null;
};

const normalizeMarketInput = (input: unknown) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;

  const raw = input as Record<string, unknown>;
  if (raw.umaResolutionStatus != null) return raw;

  if (raw.umaResolutionStatuses != null) {
    return {
      ...raw,
      umaResolutionStatus: raw.umaResolutionStatuses,
    };
  }

  return raw;
};

const MarketBaseSchema = z.object({
  id: z.string(),
  question: z.string(),
  slug: z.string(),
  icon: z.string().optional().nullable(),
  endDateIso: z.string().transform((val) => new Date(val)),
  closed: z.boolean(),
  outcomes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable()
    .transform((val) => {
      if (Array.isArray(val)) return val;
      return val ? (JSON.parse(val) as string[]) : [];
    }),
  outcomePrices: z
    .union([z.string(), z.array(z.number())])
    .optional()
    .nullable()
    .transform((val) => {
      if (Array.isArray(val)) return val;
      return val ? (JSON.parse(val) as string[]).map(Number) : [];
    }),
  lastTradePrice: z.number().optional().nullable(),
  bestBid: z.number().optional().nullable(),
  bestAsk: z.number().optional().nullable(),
  volume: z.coerce.number().optional().nullable(),
  volume24hr: z.number().optional().nullable(),
  liquidity: z.coerce.number().optional().nullable(),
  groupItemTitle: z.string().optional().nullable(),
  umaResolutionStatus: z
    .union([z.string(), z.array(z.any())])
    .optional()
    .nullable()
    .transform((val) => {
      return normalizeUmaResolutionStatus(
        Array.isArray(val) || typeof val === "string"
          ? val
          : val
      );
    }),
  umaResolutionStatuses: z
    .union([z.string(), z.array(z.any())])
    .optional()
    .nullable()
    .transform((val) => {
      if (Array.isArray(val)) return val;
      return val ? JSON.parse(val) : null;
    }),
});

export const MarketSchema = z.preprocess(normalizeMarketInput, MarketBaseSchema).transform((market) => {
  const outcomePrices = market.outcomePrices ?? [];
  const outcomes = market.outcomes ?? [];
  const umaResolutionStatus = market.umaResolutionStatus?.toLowerCase() ?? null;

  const winningIndex = outcomePrices.findIndex((price) => price === 1);

  let resolutionState: MarketResolutionState = "inprogress";

  if (market.closed && umaResolutionStatus === "resolved" && winningIndex !== -1) {
    const winningOutcome = outcomes[winningIndex]?.toLowerCase();

    if (winningOutcome === "yes") {
      resolutionState = "yes";
    } else if (winningOutcome === "no") {
      resolutionState = "no";
    }
  }

  return {
    ...market,
    resolutionState,
  };
});

export type Market = z.infer<typeof MarketSchema>;
