const fs = require('fs');
const path = require('path');
const {
  PrivateKey,
  KeyAlgorithm,
  HttpHandler,
  SpeculativeClient,
  ContractCallBuilder,
  Args,
  CLValue,
  Key
} = require('casper-js-sdk');

const RPC_URL = 'https://node.testnet.casper.network/rpc';
const KEYS_DIR = path.join(__dirname, '..', 'keys');
const UNDERWRITER_STAKE_HASH = '8f0371913f6d61d11d7e82c5b862c6a3d28f987cdf48084ed903623c26cc4fb4';

async function main() {
  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, 'servicer_secret_key.pem'), 'utf8');
  const privateKey = PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);

  const bPem = fs.readFileSync(path.join(KEYS_DIR, 'underwriter_B_secret_key.pem'), 'utf8');
  const bKey = PrivateKey.fromPem(bPem, KeyAlgorithm.ED25519);
  const bAccountKey = Key.newKey(bKey.publicKey.accountHash().toPrefixedString());

  const runtimeArgs = Args.fromMap({ underwriter: CLValue.newCLKey(bAccountKey) });

  const transaction = new ContractCallBuilder()
    .from(privateKey.publicKey)
    .byPackageHash(UNDERWRITER_STAKE_HASH)
    .entryPoint('stake_of')
    .runtimeArgs(runtimeArgs)
    .chainName('casper-test')
    .payment(5_000_000_000)
    .buildFor1_5();

  transaction.sign(privateKey);
  const deploy = transaction.getDeploy();

  const specClient = SpeculativeClient.newSpeculativeClient(new HttpHandler(RPC_URL));
  try {
    const result = await specClient.speculativeExec(String(Date.now()), deploy);
    console.log('speculative exec result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('ERROR (probablemente el nodo no expone speculative_exec):', e.message || e);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
