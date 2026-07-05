const { HttpHandler, RpcClient, TransactionVersion } = require('casper-js-sdk');

const RPC_URL = 'https://node.testnet.casper.network/rpc';
const BLOCKS_TO_SCAN = 3000;
const MAX_TX_INSPECTED = 400;
const MAX_SAMPLES = 10;
const MIN_MODULE_BYTES = 500; // descarta sessions triviales/vacias

async function main() {
  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));

  const latest = await rpcClient.getLatestBlock();
  const latestHeight = latest.block.height;
  console.log('Bloque mas reciente:', latestHeight, '- escaneando hacia atras...');

  const samples = [];
  let inspected = 0;

  for (
    let h = latestHeight;
    h > latestHeight - BLOCKS_TO_SCAN && samples.length < MAX_SAMPLES && inspected < MAX_TX_INSPECTED;
    h--
  ) {
    let block;
    try {
      const res = await rpcClient.getBlockByHeight(h);
      block = res.block;
    } catch (e) {
      continue;
    }

    const txs = block.transactions || [];
    if (txs.length === 0) continue;

    for (const tx of txs) {
      if (inspected >= MAX_TX_INSPECTED || samples.length >= MAX_SAMPLES) break;
      const hashHex = tx.hash.toHex();
      inspected++;

      try {
        let deploy, execInfo;
        if (tx.version === TransactionVersion.Deploy) {
          const info = await rpcClient.getDeploy(hashHex);
          deploy = info.deploy;
          execInfo = info.executionInfo;
        } else {
          continue; // solo nos interesan deploys clasicos (legacy install)
        }

        const moduleBytes = deploy && deploy.session && deploy.session.moduleBytes;
        if (!moduleBytes || moduleBytes.moduleBytes.length < MIN_MODULE_BYTES) continue;

        const argNames = Array.from(moduleBytes.args.args.keys());
        // El "proxy caller" generico de Odra siempre usa esta firma de args
        // (package_hash/entry_point/args/...) para LLAMAR un contrato ya existente,
        // no para instalar uno nuevo - descartarlo para no comparar cosas distintas.
        const isProxyCaller = argNames.includes('package_hash') && argNames.includes('entry_point');
        if (isProxyCaller) continue;

        const errorMessage = execInfo ? execInfo.executionResult.errorMessage : undefined;
        const success = execInfo ? !errorMessage : undefined;
        const cost = execInfo ? execInfo.executionResult.cost : undefined;

        samples.push({ block: h, hash: hashHex, cost, success, errorMessage, wasmSize: moduleBytes.moduleBytes.length, argNames });
        console.log(
          `Bloque ${h} | tx ${hashHex} | wasmSize=${moduleBytes.moduleBytes.length}B | args=[${argNames.join(',')}] | cost=${cost} motes | success=${success}` +
            (errorMessage ? ` | error=${errorMessage}` : '')
        );
      } catch (e) {
        // deploy no encontrado / error transitorio, seguir
      }
    }
  }

  console.log('');
  console.log('=== RESUMEN ===');
  console.log('Transacciones inspeccionadas:', inspected, '| Bloques recorridos hasta:', latestHeight - BLOCKS_TO_SCAN < 0 ? 0 : latestHeight);
  console.log('Installs (wasm real) encontrados:', samples.length);
  const successful = samples.filter(s => s.success && s.cost);
  if (successful.length > 0) {
    const costs = successful.map(s => s.cost);
    console.log('Costos (motes) de installs EXITOSOS:', costs);
    console.log('Minimo:', Math.min(...costs) / 1_000_000_000, 'CSPR | Maximo:', Math.max(...costs) / 1_000_000_000, 'CSPR');
  } else {
    console.log('No se encontraron installs exitosos en el rango escaneado.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
