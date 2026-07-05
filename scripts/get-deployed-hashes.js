const fs = require('fs');
const path = require('path');
const { HttpHandler, RpcClient, PublicKey, AccountIdentifier } = require('casper-js-sdk');

const RPC_URL = 'https://node.testnet.casper.network/rpc';
const PUBLIC_KEY_HEX = '01b5f0782df0a5dcc29de6e97ff1703404708b9da149cf393c11f1ac69f6037090';

const KEY_NAMES = [
  'hello_package_hash',
  'constitution_package_hash',
  'reputation_package_hash',
  'underwriter_stake_package_hash',
  'attestation_registry_package_hash',
  'tranche_vault_package_hash'
];

async function main() {
  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  const publicKey = PublicKey.fromHex(PUBLIC_KEY_HEX);

  const accountInfo = await rpcClient.getAccountInfo(null, new AccountIdentifier(undefined, publicKey));

  const result = {};
  for (const keyName of KEY_NAMES) {
    const found = accountInfo.account.namedKeys.find(nk => nk.name === keyName);
    result[keyName] = found ? found.key.toString() : null;
    console.log(keyName, '->', found ? found.key.toString() : 'NO ENCONTRADA');
  }

  fs.writeFileSync(
    path.join(__dirname, 'deployed-hashes-raw.json'),
    JSON.stringify(result, null, 2)
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
