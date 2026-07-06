import casperSdk from 'casper-js-sdk';
import { RPC_URL, realBalanceCspr } from './servicer-agent.mjs';

const { HttpHandler, RpcClient } = casperSdk;

const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
const wallets = ['underwriter_A', 'underwriter_B', 'investor', 'servicer'];

let total = 0;
for (const wallet of wallets) {
  const balance = await realBalanceCspr(rpcClient, wallet);
  total += balance;
  console.log(`${wallet.padEnd(14)} ${balance.toFixed(3).padStart(12)} CSPR`);
}
console.log('-'.repeat(30));
console.log(`${'TOTAL'.padEnd(14)} ${total.toFixed(3).padStart(12)} CSPR`);
