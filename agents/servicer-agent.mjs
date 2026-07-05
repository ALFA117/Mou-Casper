import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import casperSdk from 'casper-js-sdk';
import { appendRunLog } from './run-log.mjs';

const {
  PrivateKey,
  KeyAlgorithm,
  HttpHandler,
  RpcClient,
  ContractCallBuilder,
  Args,
  CLValue,
  Key,
  PurseIdentifier
} = casperSdk;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const RPC_URL = process.env.CASPER_NODE_RPC_URL;
export const CHAIN_NAME = 'casper-test';
export const KEYS_DIR = path.join(__dirname, '..', 'keys');

export const TRANCHE_VAULT_PACKAGE_HASH = process.env.TRANCHE_VAULT_CONTRACT_HASH;
export const UNDERWRITER_STAKE_PACKAGE_HASH = process.env.UNDERWRITER_STAKE_CONTRACT_HASH;
export const REPUTATION_PACKAGE_HASH = process.env.REPUTATION_CONTRACT_HASH;

// Servicer/Monitor Agent (Paso 9/10). Disparador manual en esta fase (el boton
// real vive en el dashboard, Paso 12/13) -- pero UNA VEZ disparado, la cadena
// completa (mark_default -> slash -> penalize -> reward) corre sola, sin pasos
// manuales intermedios.

export function loadKey(walletName) {
  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, `${walletName}_secret_key.pem`), 'utf8');
  return PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);
}

export function accountKeyFromWallet(walletName) {
  const pk = loadKey(walletName);
  return Key.newKey(pk.publicKey.accountHash().toPrefixedString());
}

export async function realBalanceCspr(rpcClient, walletName) {
  const pk = loadKey(walletName).publicKey;
  const result = await rpcClient.queryLatestBalance(PurseIdentifier.fromPublicKey(pk));
  return Number(result.rawJSON.balance) / 1_000_000_000;
}

export function printExecutionResult(label, deployHashHex, result) {
  const execInfo = result.executionInfo;
  const errorMessage = execInfo ? execInfo.executionResult.errorMessage : undefined;
  const success = execInfo ? !errorMessage : undefined;
  const cost = execInfo ? execInfo.executionResult.cost : undefined;
  const refund = execInfo ? execInfo.executionResult.refund : undefined;
  const netCost = cost != null && refund != null ? Number(cost) - Number(refund) : undefined;
  console.log(`  [${label}] deploy ${deployHashHex} -> ${success ? 'SUCCESS' : 'FAILURE'}`);
  console.log(`  [${label}] payment declarado: ${cost} motes | reembolso: ${refund} motes | costo neto real: ${netCost} motes (~${netCost != null ? (netCost / 1e9).toFixed(3) : '?'} CSPR)`);
  if (!success) console.log(`  [${label}] error:`, errorMessage);
  console.log(`  [${label}] https://testnet.cspr.live/deploy/${deployHashHex}`);
  return { success, cost, refund, netCost, deployHashHex };
}

export async function callEntryPoint(rpcClient, signerWalletName, packageHashHex, entryPoint, runtimeArgs, paymentMotes) {
  const privateKey = loadKey(signerWalletName);
  const transaction = new ContractCallBuilder()
    .from(privateKey.publicKey)
    .byPackageHash(packageHashHex.replace(/^hash-/, ''))
    .entryPoint(entryPoint)
    .runtimeArgs(runtimeArgs)
    .chainName(CHAIN_NAME)
    .payment(paymentMotes)
    .buildFor1_5();

  transaction.sign(privateKey);
  const deploy = transaction.getDeploy();
  await rpcClient.putDeploy(deploy);
  const result = await rpcClient.waitForDeploy(deploy, 180000);
  return printExecutionResult(entryPoint, deploy.hash.toHex(), result);
}

/**
 * Cadena autonoma del Servicer/Monitor Agent: mark_default -> slash -> penalize -> reward.
 * El bps de slash se calcula UNA SOLA VEZ aqui, off-chain, a partir de datos REALES de la
 * corrida (el price_bps que realmente coto B vs el recommendedSpreadBps real del feed de
 * riesgo de ESE activo) -- no hardcodeado, para que demo-run.mjs pueda usar esto con
 * cualquier activo/corrida. slash()/penalize()/reward() se usan tal cual estan (el contrato
 * no calcula nada por su cuenta, solo aplica el bps/points que se le den).
 */
export async function runDefaultChain({
  assetId,
  lossAmountCspr,
  marketRecommendedSpreadBps,
  bQuotedSpreadBps,
  aStakeCspr,
  bStakeCspr,
  startingScore = 500,
  rewardPoints = 50
}) {
  const slashBps = Math.round(((marketRecommendedSpreadBps - bQuotedSpreadBps) / marketRecommendedSpreadBps) * 10000);
  const penalizePoints = Math.round((slashBps / 10000) * 1000);

  console.log('=== Servicer/Monitor Agent — default simulado ===\n');
  console.log(`Activo: ${assetId} | Perdida a marcar: ${lossAmountCspr} CSPR`);
  console.log(`Slash calculado para underwriter_B: ${slashBps} bps (= (${marketRecommendedSpreadBps}-${bQuotedSpreadBps})/${marketRecommendedSpreadBps} de sub-precio vs el feed de riesgo)`);
  console.log(`Penalizacion de reputacion para B: ${penalizePoints} puntos (mismo % escalado a 0-1000) | Recompensa para A: ${rewardPoints} puntos\n`);

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));

  console.log('--- ESTADO ANTES ---');
  console.log(`underwriter_A: stake ${aStakeCspr} CSPR | reputacion ${startingScore}`);
  console.log(`underwriter_B: stake ${bStakeCspr} CSPR | reputacion ${startingScore}\n`);

  console.log('1) mark_default() en TrancheVault...');
  const lossAmountMotes = String(Math.round(lossAmountCspr * 1_000_000_000));
  const markDefaultResult = await callEntryPoint(
    rpcClient, 'servicer', TRANCHE_VAULT_PACKAGE_HASH, 'mark_default',
    Args.fromMap({ loss_amount: CLValue.newCLUInt512(lossAmountMotes) }),
    15_000_000_000
  );

  console.log('\n2) slash() en UnderwriterStake sobre underwriter_B...');
  // beneficiary tiene que ser una CUENTA, no un contrato: Odra bloquea
  // env().transfer_tokens() hacia un contrato (ExecutionError::TransferToContract,
  // codigo 103 -> "User error: 64639" = 64536+103). TrancheVault no tiene un
  // entry-point payable para recibir esto, asi que el fondo slasheado va a
  // `servicer` como cuenta-tesoro del protocolo (no se toca el contrato).
  const slashResult = await callEntryPoint(
    rpcClient, 'servicer', UNDERWRITER_STAKE_PACKAGE_HASH, 'slash',
    Args.fromMap({
      underwriter: CLValue.newCLKey(accountKeyFromWallet('underwriter_B')),
      bps: CLValue.newCLUInt32(slashBps),
      beneficiary: CLValue.newCLKey(accountKeyFromWallet('servicer'))
    }),
    15_000_000_000
  );

  console.log('\n3) penalize() en Reputation sobre underwriter_B...');
  const penalizeResult = await callEntryPoint(
    rpcClient, 'servicer', REPUTATION_PACKAGE_HASH, 'penalize',
    Args.fromMap({
      underwriter: CLValue.newCLKey(accountKeyFromWallet('underwriter_B')),
      points: CLValue.newCLUInt32(penalizePoints)
    }),
    15_000_000_000
  );

  console.log('\n4) reward() en Reputation sobre underwriter_A...');
  const rewardResult = await callEntryPoint(
    rpcClient, 'servicer', REPUTATION_PACKAGE_HASH, 'reward',
    Args.fromMap({
      underwriter: CLValue.newCLKey(accountKeyFromWallet('underwriter_A')),
      points: CLValue.newCLUInt32(rewardPoints)
    }),
    15_000_000_000
  );

  const slashedCspr = (bStakeCspr * slashBps) / 10000;

  console.log('\n--- ESTADO DESPUES (formula real del contrato) ---');
  console.log(`underwriter_A: stake ${aStakeCspr} CSPR (intacto) | reputacion ${startingScore + rewardPoints}`);
  console.log(`underwriter_B: stake ${(bStakeCspr - slashedCspr).toFixed(3)} CSPR | reputacion ${Math.max(0, startingScore - penalizePoints)}`);

  const expectedAfter = {
    aStake: aStakeCspr,
    bStake: bStakeCspr - slashedCspr,
    aScore: startingScore + rewardPoints,
    bScore: Math.max(0, startingScore - penalizePoints)
  };

  appendRunLog({
    type: 'default_chain',
    assetId,
    lossAmountCspr,
    slashBps,
    penalizePoints,
    rewardPoints,
    expectedAfter,
    hashes: {
      markDefault: markDefaultResult.deployHashHex,
      slash: slashResult.deployHashHex,
      penalize: penalizeResult.deployHashHex,
      reward: rewardResult.deployHashHex
    },
    success: Boolean(
      markDefaultResult.success && slashResult.success && penalizeResult.success && rewardResult.success
    )
  });

  return {
    slashBps,
    penalizePoints,
    rewardPoints,
    markDefaultResult,
    slashResult,
    penalizeResult,
    rewardResult,
    expectedAfter
  };
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  // Los ultimos 4 args son opcionales -- si no se dan, caen en los valores
  // usados en la corrida de referencia del Paso 9 (bitacora en tareas.md).
  // La ruta API /api/actions/mark-default del dashboard SI los pasa siempre,
  // leidos del run-log real mas reciente en vez de estos defaults.
  const assetId = process.argv[2] || 'invoice-batch-001';
  const lossAmountCspr = Number(process.argv[3] || 30);
  const marketRecommendedSpreadBps = Number(process.argv[4] || 450);
  const bQuotedSpreadBps = Number(process.argv[5] || 375);
  const aStakeCspr = Number(process.argv[6] || 15);
  const bStakeCspr = Number(process.argv[7] || 20);

  runDefaultChain({
    assetId,
    lossAmountCspr,
    marketRecommendedSpreadBps,
    bQuotedSpreadBps,
    aStakeCspr,
    bStakeCspr
  })
    .then(async chainResult => {
      console.log('\n=== RESUMEN DE HASHES ===');
      console.log('mark_default:', chainResult.markDefaultResult.deployHashHex, chainResult.markDefaultResult.success ? 'SUCCESS' : 'FAILURE');
      console.log('slash:       ', chainResult.slashResult.deployHashHex, chainResult.slashResult.success ? 'SUCCESS' : 'FAILURE');
      console.log('penalize:    ', chainResult.penalizeResult.deployHashHex, chainResult.penalizeResult.success ? 'SUCCESS' : 'FAILURE');
      console.log('reward:      ', chainResult.rewardResult.deployHashHex, chainResult.rewardResult.success ? 'SUCCESS' : 'FAILURE');

      const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
      const finalBalance = await realBalanceCspr(rpcClient, 'servicer');
      console.log(`Balance real de servicer (leido on-chain): ${finalBalance.toFixed(3)} CSPR`);
    })
    .catch(err => {
      console.error('\n=== ERROR ===');
      console.error(err);
      process.exit(1);
    });
}
