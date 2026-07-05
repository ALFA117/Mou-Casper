const fs = require('fs');
const path = require('path');
const {
  PrivateKey,
  KeyAlgorithm,
  HttpHandler,
  RpcClient,
  SessionBuilder,
  Args,
  CLValue
} = require('casper-js-sdk');

// Checkpoint (tareas.md Paso 4): deploy de Hello.wasm a Testnet.
// Formato Deploy clasico (buildFor1_5) porque el nodo de testnet build 2.2.2
// espera classic pricing, no el formato de transaccion nuevo.
const RPC_URL = 'https://node.testnet.casper.network/rpc';
const CHAIN_NAME = 'casper-test';
const WASM_PATH = path.join(__dirname, '..', 'contracts', 'wasm', 'Hello.wasm');
const SECRET_KEY_PATH = path.join(__dirname, '..', 'keys', 'underwriter_1_secret_key.pem');

// Reintento tras el fix de bulk-memory: Hello es minusculo (~270KB, sin logica
// de negocio). Si vuelve a fallar por otra causa, que el fallo cueste poco.
const PAYMENT_MOTES = 300_000_000_000; // 300 CSPR (20 y 100 CSPR se quedaron sin gas)

// Args que espera el wasm generado por Odra 2.8.x al instalar (constructor init()
// sin parametros propios) - ver Filo #2 de tareas.md.
function buildInstallArgs() {
  return Args.fromMap({
    odra_cfg_package_hash_key_name: CLValue.newCLString('hello_package_hash'),
    odra_cfg_allow_key_override: CLValue.newCLValueBool(true),
    odra_cfg_is_upgradable: CLValue.newCLValueBool(true),
    odra_cfg_is_upgrade: CLValue.newCLValueBool(false)
  });
}

function printExecutionResult(deployHashHex, result) {
  const execInfo = result.executionInfo;
  const legacyResults = result.executionResultsV1;

  let success;
  let errorMessage;
  let blockHash;
  let cost;

  if (execInfo) {
    errorMessage = execInfo.executionResult.errorMessage;
    success = !errorMessage;
    blockHash = execInfo.blockHash ? execInfo.blockHash.toHex() : undefined;
    cost = execInfo.executionResult.cost;
  } else if (legacyResults && legacyResults.length > 0) {
    const r = legacyResults[0].result;
    success = !!r.success;
    errorMessage = r.failure ? r.failure.errorMessage : undefined;
    blockHash = legacyResults[0].blockHash ? legacyResults[0].blockHash.toHex() : undefined;
    cost = r.success ? r.success.cost : (r.failure ? r.failure.cost : undefined);
  } else {
    console.log('--- RESULTADO ---');
    console.log('No se encontro executionInfo ni executionResultsV1 en la respuesta.');
    console.log('rawJSON completo:', JSON.stringify(result.rawJSON, null, 2));
    return;
  }

  console.log('');
  console.log('=== RESULTADO FINAL ===');
  console.log('Deploy hash:', deployHashHex);
  console.log('Block hash:', blockHash);
  console.log('Costo (motes):', cost);
  console.log('Estado:', success ? 'SUCCESS' : 'FAILURE');
  if (!success) {
    console.log('Error:', errorMessage);
  }
  console.log('CSPR.live:', 'https://testnet.cspr.live/deploy/' + deployHashHex);
}

async function main() {
  const wasmBytes = new Uint8Array(fs.readFileSync(WASM_PATH));
  const secretKeyPem = fs.readFileSync(SECRET_KEY_PATH, 'utf8');
  const privateKey = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);

  console.log('Cuenta que firma:', privateKey.publicKey.toHex());
  console.log('WASM:', WASM_PATH, `(${wasmBytes.length} bytes)`);

  const transaction = new SessionBuilder()
    .from(privateKey.publicKey)
    .wasm(wasmBytes)
    .installOrUpgrade()
    .runtimeArgs(buildInstallArgs())
    .chainName(CHAIN_NAME)
    .payment(PAYMENT_MOTES)
    .buildFor1_5();

  transaction.sign(privateKey);

  const deploy = transaction.getDeploy();
  if (!deploy) {
    throw new Error(
      'buildFor1_5() no devolvio un Deploy clasico interno (getDeploy() vacio) - revisar version de casper-js-sdk'
    );
  }

  const deployHashHex = deploy.hash.toHex();
  console.log('Deploy hash (calculado localmente):', deployHashHex);

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));

  console.log('Enviando deploy a', RPC_URL, '...');
  const putResult = await rpcClient.putDeploy(deploy);
  console.log('Nodo confirmo recepcion. deployHash:', putResult.deployHash.toHex());

  console.log('Esperando ejecucion (timeout 180s)...');
  const result = await rpcClient.waitForDeploy(deploy, 180000);

  printExecutionResult(deployHashHex, result);
}

main().catch(err => {
  console.error('');
  console.error('=== ERROR (deploy detenido, no reintentar automaticamente) ===');
  console.error(err);
  process.exit(1);
});
