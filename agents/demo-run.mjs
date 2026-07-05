import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import casperSdk from 'casper-js-sdk';

import {
  RPC_URL,
  runUnderwriterLoop
} from './underwriter-agent.mjs';

import {
  runDefaultChain,
  callEntryPoint,
  realBalanceCspr
} from './servicer-agent.mjs';

import { buyTranche as investorBuyTranche } from './investor-agent.mjs';

const { RpcClient, HttpHandler, Args, CLValue } = casperSdk;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CONSTITUTION_PACKAGE_HASH = process.env.CONSTITUTION_CONTRACT_HASH;

// --- Constitution: prueba de que revierte al pasarse de limites -------------

async function testConstitutionReverts() {
  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  // max_exposure_per_asset se fijo en 500 CSPR al deploy (Paso 5). Pedimos
  // "exposicion" de 100,000 CSPR a proposito -- se espera que la tx FALLE
  // (ExposureLimitExceeded). Esa falla ES la evidencia, no un error nuestro.
  const requestedExposureMotes = String(100_000 * 1_000_000_000);
  const result = await callEntryPoint(
    rpcClient,
    'servicer',
    CONSTITUTION_PACKAGE_HASH,
    'assert_within_exposure',
    Args.fromMap({ requested_exposure: CLValue.newCLUInt512(requestedExposureMotes) }),
    10_000_000_000
  );
  return result;
}

// --- Orquestacion completa ---------------------------------------------------

function netCost(r) {
  if (r.netCost != null) return r.netCost;
  if (r.cost != null && r.refund != null) return Number(r.cost) - Number(r.refund);
  return r.cost != null ? Number(r.cost) : 0;
}

async function main() {
  const assetId = process.argv[2] || 'invoice-batch-002';
  const aStakeCspr = Number(process.argv[3] || 15);
  const bStakeCspr = Number(process.argv[4] || 20);
  const investorSeniorCspr = Number(process.argv[5] || 15);
  const investorJuniorCspr = Number(process.argv[6] || 10);
  const lossAmountCspr = Number(process.argv[7] || 30);

  const allResults = [];
  console.log('####################################################');
  console.log('#  AVAL — demo:run — arco completo, una invocacion  #');
  console.log('####################################################\n');
  console.log(`Activo: ${assetId}\n`);

  console.log('--- PASO 0: tokenizar activo ---');
  console.log(`(no hay un entry-point de "tokenizacion" dedicado en el MVP — el activo "${assetId}"`);
  console.log('ya vive en el feed de riesgo de /x402-service; se "tokeniza" en el sentido de que');
  console.log('AttestationRegistry + TrancheVault son su representacion on-chain desde aqui en adelante.)\n');

  console.log('--- PASO 1: Underwriter A (conservador) ---');
  const aRun = await runUnderwriterLoop({
    walletName: 'underwriter_A',
    assetId,
    stakeAmountCspr: aStakeCspr,
    profileKey: 'conservative'
  });
  allResults.push(['A.x402', aRun.paymentResponse], ['A.register', aRun.registerResult], ['A.stake', aRun.stakeResult], ['A.attest', aRun.attestResult]);

  console.log('\n--- PASO 2: Underwriter B (agresivo) ---');
  const bRun = await runUnderwriterLoop({
    walletName: 'underwriter_B',
    assetId,
    stakeAmountCspr: bStakeCspr,
    profileKey: 'aggressive'
  });
  allResults.push(['B.x402', bRun.paymentResponse], ['B.register', bRun.registerResult], ['B.stake', bRun.stakeResult], ['B.attest', bRun.attestResult]);

  console.log('\n--- PASO 3: Investor compra tramos ---');
  const buySeniorResult = await investorBuyTranche('buy_senior', investorSeniorCspr);
  const buyJuniorResult = await investorBuyTranche('buy_junior', investorJuniorCspr);
  allResults.push(['investor.buy_senior', buySeniorResult], ['investor.buy_junior', buyJuniorResult]);

  console.log('\n--- PASO 4: prueba de que Constitution revierte fuera de limites ---');
  const constitutionTest = await testConstitutionReverts();
  const constitutionTestPassed = constitutionTest.success === false; // FALLAR es el resultado correcto
  console.log(`Prueba de Constitution: ${constitutionTestPassed ? 'SUCCESS (revirtio como se esperaba)' : 'FAILURE (no revirtio -- esto SI seria un bug)'}`);
  allResults.push(['constitution.revert_test', constitutionTest]);

  console.log('\n--- PASO 5: default simulado + cadena del servicer ---');
  const marketRecommendedSpreadBps = bRun.riskData.recommendedSpreadBps;
  const bQuotedSpreadBps = bRun.quote.price_bps;
  const chainResult = await runDefaultChain({
    assetId,
    lossAmountCspr,
    marketRecommendedSpreadBps,
    bQuotedSpreadBps,
    aStakeCspr,
    bStakeCspr
  });
  allResults.push(
    ['servicer.mark_default', chainResult.markDefaultResult],
    ['servicer.slash', chainResult.slashResult],
    ['servicer.penalize', chainResult.penalizeResult],
    ['servicer.reward', chainResult.rewardResult]
  );

  console.log('\n####################################################');
  console.log('#  RESUMEN FINAL                                    #');
  console.log('####################################################\n');

  console.log('Cotizacion A (conservador):', JSON.stringify(aRun.quote));
  console.log('Cotizacion B (agresivo):   ', JSON.stringify(bRun.quote));

  console.log('\n--- Hashes ---');
  for (const [label, r] of allResults) {
    const hash = r?.transaction || r?.deployHashHex || 'N/A';
    const status = r?.success === undefined ? (r?.transaction ? 'SUCCESS' : 'N/A') : (r.success ? 'SUCCESS' : 'FAILURE');
    console.log(`${label.padEnd(28)} ${hash}  ${status}`);
  }

  console.log('\n--- Estado esperado despues (formula real de los contratos) ---');
  console.log(`underwriter_A: stake ${chainResult.expectedAfter.aStake} CSPR | reputacion ${chainResult.expectedAfter.aScore}`);
  console.log(`underwriter_B: stake ${chainResult.expectedAfter.bStake.toFixed(3)} CSPR | reputacion ${chainResult.expectedAfter.bScore}`);

  const totalNet = allResults.reduce((sum, [, r]) => sum + (r?.netCost != null ? r.netCost : (r?.cost && r?.refund != null ? Number(r.cost) - Number(r.refund) : 0)), 0);
  console.log(`\nCosto neto real total de esta corrida (payment - refund, sin contar x402/WCSPR): ~${(totalNet / 1e9).toFixed(3)} CSPR`);

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  const finalBalance = await realBalanceCspr(rpcClient, 'servicer');
  console.log(`Balance real de servicer leido on-chain al cierre: ${finalBalance.toFixed(3)} CSPR`);
}

main().catch(err => {
  console.error('\n=== ERROR ===');
  console.error(err);
  process.exit(1);
});
