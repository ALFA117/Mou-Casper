const fs = require('fs');
const path = require('path');
const { HttpHandler, RpcClient, PrivateKey, KeyAlgorithm, ParamDictionaryIdentifier, ParamDictionaryIdentifierURef } = require('casper-js-sdk');

const RPC_URL = 'https://node.testnet.casper.network/rpc';
const WCSPR_ACTIVE_CONTRACT_HASH = 'hash-4b351800391d4a47a7f932e9498516ed59bb41056d2743c14a8b1a5f90f67b3e';
const KEYS_DIR = path.join(__dirname, '..', 'keys');

async function main() {
  const walletName = process.argv[2];
  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));

  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, `${walletName}_secret_key.pem`), 'utf8');
  const privateKey = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);
  const accountHashHex = privateKey.publicKey.accountHash().toPrefixedString().replace('account-hash-', '');

  // balances es un Dictionary del CEP-18 (uref: contract.named_keys 'balances'),
  // indexado por account-hash del holder.
  const contractResult = await rpcClient.queryLatestGlobalState(WCSPR_ACTIVE_CONTRACT_HASH, []);
  const contract = contractResult.rawJSON.stored_value.Contract;
  const balancesUref = contract.named_keys.find(nk => nk.name === 'balances').key;

  // CEP-18 (cep18 reference impl) usa como dictionary item key el base64 de los bytes
  // del Key::Account(account_hash) (tag 0x00 + 32 bytes), no el hex crudo.
  const accountHashBytes = Buffer.from(accountHashHex, 'hex');
  const keyBytes = Buffer.concat([Buffer.from([0x00]), accountHashBytes]);
  const dictionaryItemKeyB64 = keyBytes.toString('base64');

  try {
    const identifier = new ParamDictionaryIdentifier(
      undefined,
      undefined,
      new ParamDictionaryIdentifierURef(dictionaryItemKeyB64, balancesUref)
    );
    const dictResult = await rpcClient.getDictionaryItemByIdentifier(null, identifier);
    console.log(walletName, 'balance WCSPR:', JSON.stringify(dictResult.rawJSON.stored_value));
  } catch (e) {
    console.log(walletName, '-> no tiene entrada en balances (0 WCSPR) o error:', e.message || e);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
