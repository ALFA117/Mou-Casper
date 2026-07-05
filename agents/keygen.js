const fs = require('fs');
const path = require('path');
const { PrivateKey, KeyAlgorithm } = require('casper-js-sdk');

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Uso: node keygen.js <nombre>  (ej: underwriter_A, investor)');
    process.exit(1);
  }

  const privateKey = await PrivateKey.generate(KeyAlgorithm.ED25519);
  const publicKeyHex = privateKey.publicKey.toHex();
  const accountHash = privateKey.publicKey.accountHash().toPrefixedString();

  const keysDir = path.join(__dirname, '..', 'keys');
  fs.mkdirSync(keysDir, { recursive: true });

  fs.writeFileSync(
    path.join(keysDir, `${name}_secret_key.pem`),
    privateKey.toPem()
  );
  fs.writeFileSync(
    path.join(keysDir, `${name}_public_key.pem`),
    privateKey.publicKey.toPem()
  );
  fs.writeFileSync(
    path.join(keysDir, `${name}_public_key_hex.txt`),
    publicKeyHex
  );

  console.log('nombre:', name);
  console.log('publicKeyHex:', publicKeyHex);
  console.log('accountHash:', accountHash);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
