import { config } from "dotenv";
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { createClientCasperSigner } from "@make-software/casper-x402";
import { ExactCasperScheme } from "@make-software/casper-x402/exact/client";
import casperSdk from "casper-js-sdk";

const { KeyAlgorithm } = casperSdk;

config();

const privateKeyPath = process.env.CLIENT_PRIVATE_KEY_PATH as string;
const algorithm = process.env.CLIENT_KEY_ALGO === "secp256k1" ? KeyAlgorithm.SECP256K1 : KeyAlgorithm.ED25519;
const baseURL = process.env.SERVER_URL || "http://localhost:4021";
const assetId = process.argv[2] || "invoice-batch-001";
const url = `${baseURL}/risk-data?assetId=${assetId}`;

async function main(): Promise<void> {
  console.log(`Ciclo x402 de prueba - GET ${url}\n`);

  const casperSigner = await createClientCasperSigner(privateKeyPath, algorithm);
  const client = new x402Client().register("casper:*", new ExactCasperScheme(casperSigner));
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  console.log("1) Request inicial (el cliente maneja el 402 y firma el pago automaticamente)...");
  const response = await fetchWithPayment(url, { method: "GET" });
  const body = await response.json();

  console.log("2) Respuesta final:", response.status);
  console.log("Datos de riesgo recibidos:", body);

  const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name => response.headers.get(name));
  if (paymentResponse) {
    console.log("\n3) Detalle del settlement on-chain:", paymentResponse);
    if ((paymentResponse as any).transaction) {
      console.log("CSPR.live:", `https://testnet.cspr.live/deploy/${(paymentResponse as any).transaction}`);
    }
  } else {
    console.log("\n(No se encontro header de settlement en la respuesta)");
  }
}

main().catch(error => {
  console.error("ERROR:", error?.response?.data ?? error);
  process.exit(1);
});
