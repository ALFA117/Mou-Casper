import cors from "cors";
import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactCasperScheme } from "@make-software/casper-x402/exact/server";
import { FacilitatorConfig, HTTPFacilitatorClient } from "@x402/core/server";
import { AssetAmount, Network } from "@x402/core/types";

config();

const PORT = parseInt(process.env.SERVER_PORT || "4021", 10);
const PAYEE_ADDRESS = process.env.PAYEE_ADDRESS as string;
const FACILITATOR_URL = process.env.FACILITATOR_URL as string;
const CHAIN_ID = process.env.CAIP2_CHAIN_ID as Network;
const ASSET_PACKAGE = (process.env.ASSET_PACKAGE as string).replace(/^hash-/, "");
const ASSET_NAME = process.env.ASSET_NAME as string;

// Precio por request: 0.5 WCSPR (9 decimales, misma escala que motes de CSPR).
const PRICE_PER_REQUEST_BASE_UNITS = "500000000";

if (!PAYEE_ADDRESS || !FACILITATOR_URL || !CHAIN_ID || !ASSET_PACKAGE) {
  throw new Error("PAYEE_ADDRESS, FACILITATOR_URL, CAIP2_CHAIN_ID y ASSET_PACKAGE son requeridos");
}

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL } as FacilitatorConfig);

const assetAmount: AssetAmount = {
  asset: ASSET_PACKAGE,
  amount: PRICE_PER_REQUEST_BASE_UNITS,
  extra: { name: ASSET_NAME, symbol: "WCSPR", version: "1", decimals: "9" },
};

const casperScheme = new ExactCasperScheme()
  .registerAsset(CHAIN_ID, ASSET_PACKAGE, 9)
  .registerMoneyParser(() => Promise.resolve(assetAmount));

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Accept", "Authorization", "Content-Type", "Origin", "Payment-Signature"],
    exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
    maxAge: 24 * 60 * 60,
  }),
);

// Datos de riesgo de mercado "premium" que vende AVAL - lo que los Underwriter Agents
// pagan por-request via x402 antes de emitir su rating (Mou-Casper.md Seccion 5).
const RISK_FEEDS: Record<string, { defaultProbabilityBps: number; recommendedSpreadBps: number; source: string }> = {
  "invoice-batch-001": { defaultProbabilityBps: 320, recommendedSpreadBps: 450, source: "aval-risk-feed-v1" },
  "invoice-batch-002": { defaultProbabilityBps: 810, recommendedSpreadBps: 1200, source: "aval-risk-feed-v1" },
};

app.use(
  paymentMiddleware(
    {
      "GET /risk-data": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",
            network: CHAIN_ID,
            payTo: PAYEE_ADDRESS,
          },
        ],
        description: "Datos de riesgo de mercado para underwriting de un batch de facturas",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient).register(CHAIN_ID, casperScheme),
  ),
);

app.get("/risk-data", (req, res) => {
  const assetId = (req.query.assetId as string) || "invoice-batch-001";
  const feed = RISK_FEEDS[assetId] || RISK_FEEDS["invoice-batch-001"];
  res.json({
    assetId,
    defaultProbabilityBps: feed.defaultProbabilityBps,
    recommendedSpreadBps: feed.recommendedSpreadBps,
    source: feed.source,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`AVAL x402 resource server listening at http://localhost:${PORT}`);
});
