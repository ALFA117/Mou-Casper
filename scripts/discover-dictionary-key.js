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

// Patron para que el dashboard (Paso 11) lea estado REAL de los contratos, no
// calculado con formulas: los Mapping<K,V> de Odra 2.8.x se guardan como
// Dictionary nativo de Casper. Una llamada real a un getter (stake_of, score_of,
// etc.) toca la entrada de diccionario correspondiente y el efecto de ejecucion
// la revela como clave completa "dictionary-<hash>" (visible aunque el transform
// sea "Identity" - solo lectura, sin valor, pero la CLAVE si queda expuesta).
// Una vez conocida esa clave, se puede leer para SIEMPRE gratis con
// query_global_state (ver read-dictionary-value.js) sin volver a pagar gas.
//
// Uso: node discover-dictionary-key.js <wallet> <packageHash> <entryPoint> <argsJson> <paymentCSPR>

const RPC_URL = 'https://node.testnet.casper.network/rpc';
const KEYS_DIR = path.join(__dirname, '..', 'keys');

function accountKeyFromWallet(walletName) {
  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, `${walletName}_secret_key.pem`), 'utf8');
  const pk = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);
  return Key.newKey(pk.publicKey.accountHash().toPrefixedString());
}

function buildCLValue(argSpec) {
  switch (argSpec.type) {
    case 'Key':
      return CLValue.newCLKey(accountKeyFromWallet(argSpec.wallet));
    case 'String':
      return CLValue.newCLString(argSpec.value);
    case 'U32':
      return CLValue.newCLUInt32(argSpec.value);
    case 'U64':
      return CLValue.newCLUint64(argSpec.value);
    default:
      throw new Error(`Tipo no soportado: ${argSpec.type}`);
  }
}

async function main() {
  const [walletName, packageHashHex, entryPoint, argsJson, paymentCsprStr] = process.argv.slice(2);
  if (!walletName || !packageHashHex || !entryPoint || !argsJson || !paymentCsprStr) {
    console.error('Uso: node discover-dictionary-key.js <wallet> <packageHash> <entryPoint> <argsJson> <paymentCSPR>');
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

  const transaction = new ContractCallBuilder()
    .from(privateKey.publicKey)
    .byPackageHash(packageHashHex.replace(/^hash-/, ''))
    .entryPoint(entryPoint)
    .runtimeArgs(Args.fromMap(runtimeArgsMap))
    .chainName('casper-test')
    .payment(paymentMotes)
    .buildFor1_5();

  transaction.sign(privateKey);
  const deploy = transaction.getDeploy();
  console.log('Deploy hash:', deploy.hash.toHex());

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  await rpcClient.putDeploy(deploy);
  const result = await rpcClient.waitForDeploy(deploy, 180000);

  const execResult = result.rawJSON?.execution_info?.execution_result?.Version2
    || result.rawJSON?.execution_info?.execution_result?.Version1;
  if (!execResult) {
    console.log('No se pudo leer execution_result crudo. Respuesta completa:');
    console.log(JSON.stringify(result.rawJSON, null, 2));
    return;
  }

  console.log('Estado:', execResult.error_message ? 'FAILURE: ' + execResult.error_message : 'SUCCESS');
  console.log('Costo declarado:', execResult.cost, '| reembolso:', execResult.refund);

  const dictionaryKeys = (execResult.effects || [])
    .map(e => e.key)
    .filter(k => k.startsWith('dictionary-'));

  console.log('Claves de diccionario tocadas:', [...new Set(dictionaryKeys)]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
