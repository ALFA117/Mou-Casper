const fs = require('fs');
const path = require('path');
const {
  PrivateKey,
  KeyAlgorithm,
  HttpHandler,
  RpcClient,
  ContractCallBuilder,
  Args,
  CLValue,
  Key
} = require('casper-js-sdk');

// Llama una entry-point NO-payable en un contrato ya deployado, via
// ContractCallBuilder (StoredContractByHash) - mas directo/barato que el
// proxy_caller ya que no necesita top-up de cargo_purse. Args se pasan como
// JSON: {"nombre": {"type": "Key"|"String"|"U32"|"U64", "value": ...}}.
const RPC_URL = 'https://node.testnet.casper.network/rpc';
const CHAIN_NAME = 'casper-test';
const KEYS_DIR = path.join(__dirname, '..', 'keys');

function accountHashKeyFromWallet(walletName) {
  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, `${walletName}_secret_key.pem`), 'utf8');
  const pk = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);
  return Key.newKey(pk.publicKey.accountHash().toPrefixedString());
}

function buildCLValue(argSpec) {
  switch (argSpec.type) {
    case 'Key':
      return CLValue.newCLKey(accountHashKeyFromWallet(argSpec.wallet));
    case 'String':
      return CLValue.newCLString(argSpec.value);
    case 'U32':
      return CLValue.newCLUInt32(argSpec.value);
    case 'U64':
      return CLValue.newCLUint64(argSpec.value);
    default:
      throw new Error(`Tipo de arg no soportado: ${argSpec.type}`);
  }
}

function printExecutionResult(deployHashHex, result) {
  const execInfo = result.executionInfo;
  const errorMessage = execInfo ? execInfo.executionResult.errorMessage : undefined;
  const success = execInfo ? !errorMessage : undefined;
  const blockHash = execInfo && execInfo.blockHash ? execInfo.blockHash.toHex() : undefined;
  const cost = execInfo ? execInfo.executionResult.cost : undefined;

  console.log('');
  console.log('=== RESULTADO FINAL ===');
  console.log('Deploy hash:', deployHashHex);
  console.log('Block hash:', blockHash);
  console.log('Costo (motes):', cost);
  console.log('Estado:', success ? 'SUCCESS' : 'FAILURE');
  if (!success) console.log('Error:', errorMessage);
  console.log('CSPR.live:', 'https://testnet.cspr.live/deploy/' + deployHashHex);
  return { success, cost };
}

async function main() {
  const [walletName, packageHashHex, entryPoint, argsJson, paymentCsprStr] = process.argv.slice(2);

  if (!walletName || !packageHashHex || !entryPoint || !argsJson || !paymentCsprStr) {
    console.error('Uso: node call-entry-point.js <wallet> <packageHash> <entryPoint> <argsJson> <paymentCSPR>');
    console.error('argsJson ej: \'{"underwriter":{"type":"Key","wallet":"underwriter_A"}}\'');
    process.exit(1);
  }

  const paymentMotes = Math.round(Number(paymentCsprStr) * 1_000_000_000);
  const argsSpec = JSON.parse(argsJson);

  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, `${walletName}_secret_key.pem`), 'utf8');
  const privateKey = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);

  const runtimeArgsMap = {};
  for (const [name, spec] of Object.entries(argsSpec)) {
    runtimeArgsMap[name] = buildCLValue(spec);
  }
  const runtimeArgs = Args.fromMap(runtimeArgsMap);

  console.log('Wallet:', walletName, '->', privateKey.publicKey.toHex());
  console.log('Contrato (package hash):', packageHashHex);
  console.log('Entry point:', entryPoint);
  console.log('Args:', JSON.stringify(argsSpec));
  console.log('Payment (gas):', paymentCsprStr, 'CSPR =', paymentMotes, 'motes');

  const transaction = new ContractCallBuilder()
    .from(privateKey.publicKey)
    .byPackageHash(packageHashHex.replace(/^hash-/, ''))
    .entryPoint(entryPoint)
    .runtimeArgs(runtimeArgs)
    .chainName(CHAIN_NAME)
    .payment(paymentMotes)
    .buildFor1_5();

  transaction.sign(privateKey);

  const deploy = transaction.getDeploy();
  if (!deploy) throw new Error('buildFor1_5() no devolvio un Deploy clasico interno');

  const deployHashHex = deploy.hash.toHex();
  console.log('Deploy hash:', deployHashHex);

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  await rpcClient.putDeploy(deploy);
  console.log('Enviado. Esperando confirmacion...');

  const result = await rpcClient.waitForDeploy(deploy, 180000);
  const { success } = printExecutionResult(deployHashHex, result);
  process.exitCode = success ? 0 : 1;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
