const fs = require('fs');
const path = require('path');
const {
  PrivateKey,
  KeyAlgorithm,
  HttpHandler,
  RpcClient,
  SessionBuilder,
  Args,
  CLValue,
  CLTypeUInt8
} = require('casper-js-sdk');

// Llama una entry-point PAYABLE (#[odra(payable)] o equivalente) en un contrato ya
// deployado, adjuntando CSPR/WCSPR real. Casper (formato Deploy clasico) no tiene un
// "msg.value" nativo para StoredContractByHash -- la unica forma es un session wasm
// que hace el top-up de la cargo_purse y despues llama al entry point. Usamos el
// proxy_caller_with_return.wasm oficial de Odra (odradev/odra tag 2.8.2,
// odra-casper/test-vm/resources/), args: package_hash, entry_point, args,
// attached_value, amount (los ultimos 2 deben ser iguales). Fuente:
// https://odra.dev/docs/backends/casper (seccion "Calling payable entry points").
const RPC_URL = 'https://node.testnet.casper.network/rpc';
const CHAIN_NAME = 'casper-test';
const KEYS_DIR = path.join(__dirname, '..', 'keys');
const PROXY_CALLER_WASM_PATH = path.join(__dirname, 'wasm-tools', 'proxy_caller_with_return.wasm');

function hashHexToBytes(hashHex) {
  const clean = hashHex.replace(/^hash-/, '');
  return Uint8Array.from(Buffer.from(clean, 'hex'));
}

// El campo "args" del lado Rust es `Bytes` (bytesrepr::Bytes), que en el sistema de
// tipos CLType es List(U8) -- NO ByteArray(N) (eso es para tipos de tamano fijo como
// hashes de 32 bytes). Confundir los dos causaba ApiError::EarlyEndOfStream.
function bytesToCLBytesList(bytes) {
  return CLValue.newCLList(CLTypeUInt8, Array.from(bytes).map(b => CLValue.newCLUint8(b)));
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
  const [walletName, packageHashHex, entryPoint, attachedValueCsprStr, paymentCsprStr] = process.argv.slice(2);

  if (!walletName || !packageHashHex || !entryPoint || !attachedValueCsprStr || !paymentCsprStr) {
    console.error('Uso: node call-payable.js <wallet> <packageHash> <entryPoint> <attachedValueCSPR> <paymentCSPR>');
    process.exit(1);
  }

  const attachedValueMotes = Math.round(Number(attachedValueCsprStr) * 1_000_000_000);
  const paymentMotes = Math.round(Number(paymentCsprStr) * 1_000_000_000);

  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, `${walletName}_secret_key.pem`), 'utf8');
  const privateKey = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);
  const wasmBytes = new Uint8Array(fs.readFileSync(PROXY_CALLER_WASM_PATH));

  // args del entry point destino (stake()/buy_senior()/deposit() no llevan params propios)
  const targetArgs = Args.fromMap({});
  const targetArgsBytes = targetArgs.toBytes();

  // package_hash/entry_point/args/attached_value: leidos por ProxyCall::load_from_args
  // (odra-casper/proxy-caller/src/lib.rs, tag 2.8.2). "amount" es DISTINTO: lo lee el
  // execution engine de Casper (no el wasm) ANTES de correr la sesion, para fijar el
  // remaining_spending_limit de esa ejecucion (execution_engine/src/execution/executor.rs,
  // try_get_amount(&args)). Sin "amount", el limite es 0 y CUALQUIER transfer dentro de
  // la sesion (el top-up de la cargo_purse) revienta con Mint error 21
  // (UnapprovedSpendingAmount). Debe ser igual a attached_value.
  const proxyArgs = Args.fromMap({
    package_hash: CLValue.newCLByteArray(hashHexToBytes(packageHashHex)),
    entry_point: CLValue.newCLString(entryPoint),
    args: bytesToCLBytesList(targetArgsBytes),
    attached_value: CLValue.newCLUInt512(String(attachedValueMotes)),
    amount: CLValue.newCLUInt512(String(attachedValueMotes))
  });

  console.log('Wallet:', walletName, '->', privateKey.publicKey.toHex());
  console.log('Contrato (package hash):', packageHashHex);
  console.log('Entry point:', entryPoint);
  console.log('Valor adjunto:', attachedValueCsprStr, 'CSPR =', attachedValueMotes, 'motes');
  console.log('Payment (gas):', paymentCsprStr, 'CSPR =', paymentMotes, 'motes');

  const transaction = new SessionBuilder()
    .from(privateKey.publicKey)
    .wasm(wasmBytes)
    .runtimeArgs(proxyArgs)
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
