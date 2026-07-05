import { x402Facilitator } from "@x402/core/facilitator";
import { PaymentPayload, PaymentRequirements, SettleResponse, VerifyResponse } from "@x402/core/types";
import { ExactCasperScheme } from "@make-software/casper-x402/exact/facilitator";
import { toFacilitatorCasperSigner } from "@make-software/casper-x402";
import casperSdk from "casper-js-sdk";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4022", 10);
const NETWORK = (process.env.CASPER_NETWORKS || "casper:casper-test") as any;
const PEM = (process.env.SECRET_KEY_PEM_CASPER_CASPER_TEST || "").replace(/\\n/g, "\n");
const RPC_URL = process.env.RPCURL_CASPER_CASPER_TEST as string;
const TRANSACTION_PAYMENT_MOTES = parseInt(process.env.TRANSACTION_PAYMENT_MOTES || "15000000000", 10);

if (!PEM || !RPC_URL) {
  throw new Error("SECRET_KEY_PEM_CASPER_CASPER_TEST y RPCURL_CASPER_CASPER_TEST son requeridos");
}

const app = express();
app.use(express.json());

const facilitator = new x402Facilitator()
  .onBeforeVerify(async ctx => console.log("[facilitator] before verify", ctx))
  .onAfterVerify(async ctx => console.log("[facilitator] after verify", ctx))
  .onVerifyFailure(async ctx => console.log("[facilitator] verify failure", ctx))
  .onBeforeSettle(async ctx => console.log("[facilitator] before settle", ctx))
  .onAfterSettle(async ctx => console.log("[facilitator] after settle", ctx))
  .onSettleFailure(async ctx => console.log("[facilitator] settle failure", ctx));

async function main() {
  const privateKey = casperSdk.PrivateKey.fromPem(PEM, casperSdk.KeyAlgorithm.ED25519);
  const signer = await toFacilitatorCasperSigner(privateKey, RPC_URL);

  facilitator.register(
    NETWORK,
    new ExactCasperScheme(signer, { limitedPaymentMotes: TRANSACTION_PAYMENT_MOTES }),
  );
  console.log(`[facilitator] red ${NETWORK} configurada (rpc=${RPC_URL}, payment=${TRANSACTION_PAYMENT_MOTES} motes)`);

  app.post("/verify", async (req, res) => {
    try {
      const { paymentPayload, paymentRequirements } = req.body as {
        paymentPayload: PaymentPayload;
        paymentRequirements: PaymentRequirements;
      };
      if (!paymentPayload || !paymentRequirements) {
        return res.status(400).json({ error: "Missing paymentPayload or paymentRequirements" });
      }
      const response: VerifyResponse = await facilitator.verify(paymentPayload, paymentRequirements);
      res.json(response);
    } catch (error) {
      console.error("[facilitator] verify error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/settle", async (req, res) => {
    try {
      const { paymentPayload, paymentRequirements } = req.body;
      if (!paymentPayload || !paymentRequirements) {
        return res.status(400).json({ error: "Missing paymentPayload or paymentRequirements" });
      }
      const response: SettleResponse = await facilitator.settle(paymentPayload, paymentRequirements);
      res.json(response);
    } catch (error) {
      console.error("[facilitator] settle error:", error);
      if (error instanceof Error && error.message.includes("Settlement aborted:")) {
        return res.json({
          success: false,
          errorReason: error.message.replace("Settlement aborted: ", ""),
          network: req.body?.paymentPayload?.network || "unknown",
        });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/supported", async (_req, res) => {
    try {
      res.json(facilitator.getSupported());
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.listen(PORT, () => {
    console.log(`Facilitator listening on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
