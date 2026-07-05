const { HttpHandler, RpcClient } = require('casper-js-sdk');

// Lectura GRATIS (sin gastar CSPR) de una clave de diccionario ya descubierta
// con discover-dictionary-key.js. Decodifica U512/U32 desde el formato
// bytesrepr (length-prefixed little-endian).
const RPC_URL = 'https://node.testnet.casper.network/rpc';

function leBytesToBigInt(bytes) {
  return bytes.reduceRight((acc, b) => acc * 256n + BigInt(b), 0n);
}

// U512 (bignum variable-length): 1er byte = cantidad de bytes significativos que
// siguen (LE). Asi es como Odra/Casper serializan stakes, montos, etc.
function decodeU512(byteArray) {
  const bytes = Buffer.from(byteArray);
  const len = bytes[0];
  return leBytesToBigInt(bytes.slice(1, 1 + len));
}

// U32 (tamano fijo): siempre 4 bytes LE, sin prefijo de longitud interno. Asi
// es como Odra/Casper serializan Reputation.scores, por ejemplo.
function decodeU32(byteArray) {
  const bytes = Buffer.from(byteArray);
  return leBytesToBigInt(bytes.slice(0, 4));
}

async function main() {
  const dictionaryKey = process.argv[2];
  const valueType = (process.argv[3] || 'U512').toUpperCase();
  if (!dictionaryKey) {
    console.error('Uso: node read-dictionary-value.js <dictionary-key> [U512|U32]');
    process.exit(1);
  }

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  const result = await rpcClient.queryLatestGlobalState(dictionaryKey, []);
  const clValue = result.rawJSON.stored_value.CLValue;

  console.log('cl_type:', JSON.stringify(clValue.cl_type));
  if (clValue.cl_type && clValue.cl_type.List === 'U8') {
    const value = valueType === 'U32' ? decodeU32(clValue.parsed) : decodeU512(clValue.parsed);
    console.log('Valor decodificado:', value.toString());
    if (valueType === 'U512') {
      console.log('Como CSPR (/1e9):', Number(value) / 1e9);
    }
  } else {
    console.log('parsed:', JSON.stringify(clValue.parsed));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
