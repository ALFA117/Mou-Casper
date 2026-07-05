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

// Deploy generico para los contratos de AVAL (Paso 5). Mismo mecanismo que
// scripts/deploy-hello.js (SessionBuilder + buildFor1_5, formato Deploy clasico
// porque el nodo de testnet build 2.2.2 espera classic pricing), parametrizado
// por contrato ya que cada uno tiene su propia firma de constructor init().
const RPC_URL = 'https://node.testnet.casper.network/rpc';
const CHAIN_NAME = 'casper-test';
const WASM_DIR = path.join(__dirname, '..', 'contracts', 'wasm');
const SECRET_KEY_PATH = path.join(__dirname, '..', 'keys', 'underwriter_1_secret_key.pem');

// Valores de demo para los constructores que llevan argumentos propios (mas alla
// de los odra_cfg_* de instalacion). Documentados tambien en README.md.
const CONTRACTS = {
  Constitution: {
    wasmFile: 'Constitution.wasm',
    packageHashKeyName: 'constitution_package_hash',
    buildArgs: () => ({
      // 500 CSPR de exposicion maxima por activo (limite duro, ajustable luego
      // via set_max_exposure_per_asset por el owner).
      max_exposure_per_asset: CLValue.newCLUInt512('500000000000'),
      // 150% de ratio minimo de colateral, en basis points (10000 = 100%).
      min_collateral_ratio_bps: CLValue.newCLUInt32(15000)
    })
  },
  Reputation: {
    wasmFile: 'Reputation.wasm',
    packageHashKeyName: 'reputation_package_hash',
    buildArgs: () => ({})
  },
  UnderwriterStake: {
    wasmFile: 'UnderwriterStake.wasm',
    packageHashKeyName: 'underwriter_stake_package_hash',
    buildArgs: () => ({})
  },
  AttestationRegistry: {
    wasmFile: 'AttestationRegistry.wasm',
    packageHashKeyName: 'attestation_registry_package_hash',
    buildArgs: () => ({})
  },
  TrancheVault: {
    wasmFile: 'TrancheVault.wasm',
    packageHashKeyName: 'tranche_vault_package_hash',
    buildArgs: () => ({
      // Valor nominal de cada tranche para el demo, en motes.
      senior_face_value: CLValue.newCLUInt512('100000000000'), // 100 CSPR
      junior_face_value: CLValue.newCLUInt512('50000000000') // 50 CSPR
    })
  }
};

function buildInstallArgs(contractConfig) {
  return Args.fromMap({
    odra_cfg_package_hash_key_name: CLValue.newCLString(contractConfig.packageHashKeyName),
    odra_cfg_allow_key_override: CLValue.newCLValueBool(true),
    odra_cfg_is_upgradable: CLValue.newCLValueBool(true),
    odra_cfg_is_upgrade: CLValue.newCLValueBool(false),
    ...contractConfig.buildArgs()
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
    return { success: false };
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

  return { success, blockHash, cost };
}

async function main() {
  const contractName = process.argv[2];
  const paymentCspr = Number(process.argv[3]);

  if (!contractName || !CONTRACTS[contractName] || !paymentCspr) {
    console.error('Uso: node deploy-contract.js <NombreContrato> <paymentEnCSPR>');
    console.error('Contratos validos:', Object.keys(CONTRACTS).join(', '));
    process.exit(1);
  }

  const contractConfig = CONTRACTS[contractName];
  const paymentMotes = Math.round(paymentCspr * 1_000_000_000);

  const wasmPath = path.join(WASM_DIR, contractConfig.wasmFile);
  const wasmBytes = new Uint8Array(fs.readFileSync(wasmPath));
  const secretKeyPem = fs.readFileSync(SECRET_KEY_PATH, 'utf8');
  const privateKey = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);

  console.log('Contrato:', contractName);
  console.log('Cuenta que firma:', privateKey.publicKey.toHex());
  console.log('WASM:', wasmPath, `(${wasmBytes.length} bytes)`);
  console.log('Payment:', paymentCspr, 'CSPR =', paymentMotes, 'motes');

  const transaction = new SessionBuilder()
    .from(privateKey.publicKey)
    .wasm(wasmBytes)
    .installOrUpgrade()
    .runtimeArgs(buildInstallArgs(contractConfig))
    .chainName(CHAIN_NAME)
    .payment(paymentMotes)
    .buildFor1_5();

  transaction.sign(privateKey);

  const deploy = transaction.getDeploy();
  if (!deploy) {
    throw new Error('buildFor1_5() no devolvio un Deploy clasico interno (getDeploy() vacio)');
  }

  const deployHashHex = deploy.hash.toHex();
  console.log('Deploy hash (calculado localmente):', deployHashHex);

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));

  console.log('Enviando deploy a', RPC_URL, '...');
  const putResult = await rpcClient.putDeploy(deploy);
  console.log('Nodo confirmo recepcion. deployHash:', putResult.deployHash.toHex());

  console.log('Esperando ejecucion (timeout 180s)...');
  const result = await rpcClient.waitForDeploy(deploy, 180000);

  const { success } = printExecutionResult(deployHashHex, result);
  process.exitCode = success ? 0 : 1;
}

main().catch(err => {
  console.error('');
  console.error('=== ERROR (deploy detenido) ===');
  console.error(err);
  process.exit(1);
});
