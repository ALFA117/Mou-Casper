const { HttpHandler, RpcClient } = require('casper-js-sdk');

const RPC_URL = 'https://node.testnet.casper.network/rpc';
const DEPLOY_HASH = process.argv[2];

async function main() {
  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  const info = await rpcClient.getDeploy(DEPLOY_HASH);
  const deploy = info.deploy;

  console.log('Deploy hash:', DEPLOY_HASH);
  console.log('Cuenta:', deploy.header.account.toHex());
  console.log('Payment:', JSON.stringify(deploy.payment, null, 2));
  console.log('');
  console.log('Session moduleBytes size:', deploy.session.moduleBytes.moduleBytes.length);
  console.log('Session args:');
  const args = deploy.session.moduleBytes.args;
  for (const [name, clvalue] of args.args.entries()) {
    console.log(` - ${name}:`, JSON.stringify(clvalue, null, 2));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
