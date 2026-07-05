const { HttpHandler, RpcClient } = require('casper-js-sdk');

const RPC_URL = 'https://node.testnet.casper.network/rpc';

async function main() {
  const deployHash = process.argv[2];
  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  let execInfo;
  try {
    const result = await rpcClient.getDeploy(deployHash);
    execInfo = result.executionInfo;
  } catch (e) {
    console.log('getDeploy fallo, probando getTransactionByTransactionHash...');
    const result = await rpcClient.getTransactionByTransactionHash(deployHash);
    execInfo = result.executionInfo;
  }
  console.log('cost:', execInfo ? execInfo.executionResult.cost : 'N/A');
  console.log('error:', execInfo ? execInfo.executionResult.errorMessage : 'N/A');
  console.log('success:', execInfo ? !execInfo.executionResult.errorMessage : 'N/A');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
