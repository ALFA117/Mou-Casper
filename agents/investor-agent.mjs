import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import casperSdk from 'casper-js-sdk';

import {
  loadKey,
  hashHexToBytes,
  bytesToCLBytesList,
  PROXY_CALLER_WASM_PATH,
  RPC_URL,
  CHAIN_NAME,
  printExecutionResult
} from './underwriter-agent.mjs';
import { appendRunLog } from './run-log.mjs';

const { RpcClient, HttpHandler, SessionBuilder, Args, CLValue } = casperSdk;

const TRANCHE_VAULT_PACKAGE_HASH = process.env.TRANCHE_VAULT_CONTRACT_HASH;

/** buy_senior() / buy_junior() en TrancheVault -- payable, via proxy caller. */
export async function buyTranche(entryPoint, amountCspr) {
  const privateKey = loadKey('investor');
  const wasmBytes = new Uint8Array(fs.readFileSync(PROXY_CALLER_WASM_PATH));
  const attachedValueMotes = Math.round(amountCspr * 1_000_000_000);

  const targetArgsBytes = Args.fromMap({}).toBytes();
  const proxyArgs = Args.fromMap({
    package_hash: CLValue.newCLByteArray(hashHexToBytes(TRANCHE_VAULT_PACKAGE_HASH)),
    entry_point: CLValue.newCLString(entryPoint),
    args: bytesToCLBytesList(targetArgsBytes),
    attached_value: CLValue.newCLUInt512(String(attachedValueMotes)),
    amount: CLValue.newCLUInt512(String(attachedValueMotes))
  });

  const transaction = new SessionBuilder()
    .from(privateKey.publicKey)
    .wasm(wasmBytes)
    .runtimeArgs(proxyArgs)
    .chainName(CHAIN_NAME)
    .payment(40_000_000_000)
    .buildFor1_5();

  transaction.sign(privateKey);
  const deploy = transaction.getDeploy();

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  await rpcClient.putDeploy(deploy);
  const result = await rpcClient.waitForDeploy(deploy, 180000);
  const execResult = printExecutionResult(entryPoint, deploy.hash.toHex(), result);

  appendRunLog({
    type: 'investor_buy',
    entryPoint,
    amountCspr,
    hash: execResult.deployHashHex,
    success: execResult.success
  });

  return execResult;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  const entryPoint = process.argv[2] || 'buy_senior';
  const amountCspr = Number(process.argv[3] || 15);

  if (entryPoint !== 'buy_senior' && entryPoint !== 'buy_junior') {
    console.error('entryPoint debe ser "buy_senior" o "buy_junior"');
    process.exit(1);
  }

  buyTranche(entryPoint, amountCspr).catch(err => {
    console.error('\n=== ERROR ===');
    console.error(err);
    process.exit(1);
  });
}
