const fs = require('fs');
const path = require('path');
const {
  PrivateKey,
  PublicKey,
  KeyAlgorithm,
  HttpHandler,
  RpcClient,
  NativeTransferBuilder
} = require('casper-js-sdk');

// Transferencia nativa CSPR entre wallets propias (fondeo de underwriter_A/B/investor
// desde servicer). Formato Deploy clasico (buildFor1_5) por consistencia con el resto
// del pipeline - el nodo de testnet (build 2.2.2) espera classic pricing.
const RPC_URL = 'https://node.testnet.casper.network/rpc';
const CHAIN_NAME = 'casper-test';
const KEYS_DIR = path.join(__dirname, '..', 'keys');
const SENDER_SECRET_KEY_PATH = path.join(KEYS_DIR, 'servicer_secret_key.pem');
const PAYMENT_MOTES = 3_000_000_000; // 3 CSPR, sobra para una transferencia nativa

async function main() {
  const targetName = process.argv[2];
  const amountCspr = Number(process.argv[3]);

  if (!targetName || !amountCspr) {
    console.error('Uso: node fund-wallet.js <nombreDestino> <montoEnCSPR>');
    process.exit(1);
  }

  const targetPublicKeyHex = fs
    .readFileSync(path.join(KEYS_DIR, `${targetName}_public_key_hex.txt`), 'utf8')
    .trim();

  const senderSecretKeyPem = fs.readFileSync(SENDER_SECRET_KEY_PATH, 'utf8');
  const senderKey = PrivateKey.fromPem(senderSecretKeyPem, KeyAlgorithm.ED25519);
  const targetKey = PublicKey.fromHex(targetPublicKeyHex);

  const amountMotes = Math.round(amountCspr * 1_000_000_000);

  console.log('De (servicer):', senderKey.publicKey.toHex());
  console.log('A', `(${targetName}):`, targetPublicKeyHex);
  console.log('Monto:', amountCspr, 'CSPR =', amountMotes, 'motes');

  const transaction = new NativeTransferBuilder()
    .from(senderKey.publicKey)
    .target(targetKey)
    .amount(String(amountMotes))
    .id(Date.now())
    .chainName(CHAIN_NAME)
    .payment(PAYMENT_MOTES)
    .buildFor1_5();

  transaction.sign(senderKey);

  const deploy = transaction.getDeploy();
  if (!deploy) {
    throw new Error('buildFor1_5() no devolvio un Deploy clasico interno');
  }

  const deployHashHex = deploy.hash.toHex();
  console.log('Deploy hash:', deployHashHex);

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  await rpcClient.putDeploy(deploy);
  console.log('Enviado. Esperando confirmacion...');

  const result = await rpcClient.waitForDeploy(deploy, 120000);
  const execInfo = result.executionInfo;
  const errorMessage = execInfo ? execInfo.executionResult.errorMessage : undefined;
  const success = execInfo ? !errorMessage : undefined;

  console.log('Estado:', success ? 'SUCCESS' : 'FAILURE', errorMessage ? `| error=${errorMessage}` : '');
  console.log('CSPR.live:', 'https://testnet.cspr.live/deploy/' + deployHashHex);
  process.exitCode = success ? 0 : 1;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
