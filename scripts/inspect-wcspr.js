const { HttpHandler, RpcClient } = require('casper-js-sdk');

const RPC_URL = 'https://node.testnet.casper.network/rpc';
const WCSPR_PACKAGE_HASH = 'hash-3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e';

async function inspectOurContract(rpcClient, packageHashHex, label) {
  const packageResult = await rpcClient.queryLatestGlobalState('hash-' + packageHashHex, []);
  const versions = packageResult.rawJSON.stored_value.ContractPackage.versions;
  const active = versions[versions.length - 1];
  const contractResult = await rpcClient.queryLatestGlobalState('hash-' + active.contract_hash.replace('contract-', ''), []);
  const contract = contractResult.rawJSON.stored_value.Contract;
  console.log(`=== ${label} entry points (contract-${active.contract_hash.replace('contract-', '')}) ===`);
  for (const ep of contract.entry_points) {
    console.log(`- ${ep.name}(${ep.args.map(a => a.name + ':' + JSON.stringify(a.cl_type)).join(', ')}) -> ${JSON.stringify(ep.ret)} [${JSON.stringify(ep.entry_point_payment || ep.access)}]`);
  }
  console.log('');
}

async function main() {
  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));

  await inspectOurContract(rpcClient, '3ee548b28300fe3fc9182aa4bfc747596ab4eded0d7ab4ec23d1da91cb003516', 'Reputation');
  await inspectOurContract(rpcClient, '7bd8579d79bb857adfdbc3e3f288275ddae9078d2fe511585860784742357940', 'AttestationRegistry');
  return;

  const packageResult = await rpcClient.queryLatestGlobalState(WCSPR_PACKAGE_HASH, []);
  console.log('=== Contract Package ===');
  console.log(JSON.stringify(packageResult.rawJSON, null, 2).slice(0, 500));

  const activeContractHash = 'hash-4b351800391d4a47a7f932e9498516ed59bb41056d2743c14a8b1a5f90f67b3e';
  const contractResult = await rpcClient.queryLatestGlobalState(activeContractHash, []);
  const contract = contractResult.rawJSON.stored_value.Contract;
  console.log('');
  console.log('=== Entry points (contrato activo, version 7) ===');
  for (const ep of contract.entry_points) {
    console.log(`- ${ep.name}(${ep.args.map(a => a.name + ':' + JSON.stringify(a.cl_type)).join(', ')}) -> ${JSON.stringify(ep.ret)} [${ep.access}]`);
  }
  console.log('');
  console.log('=== Named keys ===');
  for (const nk of contract.named_keys) {
    console.log(`- ${nk.name}: ${nk.key}`);
  }

  const decimalsUref = contract.named_keys.find(nk => nk.name === 'decimals').key;
  const nameUref = contract.named_keys.find(nk => nk.name === 'name').key;
  const symbolUref = contract.named_keys.find(nk => nk.name === 'symbol').key;
  const decimalsResult = await rpcClient.queryLatestGlobalState(decimalsUref, []);
  const nameResult = await rpcClient.queryLatestGlobalState(nameUref, []);
  const symbolResult = await rpcClient.queryLatestGlobalState(symbolUref, []);
  console.log('');
  console.log('decimals:', JSON.stringify(decimalsResult.rawJSON.stored_value));
  console.log('name:', JSON.stringify(nameResult.rawJSON.stored_value));
  console.log('symbol:', JSON.stringify(symbolResult.rawJSON.stored_value));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
