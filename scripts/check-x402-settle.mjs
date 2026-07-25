// Prueba SOLO el pago x402 (verify+settle contra el WCSPR compartido de testnet),
// sin tocar register/stake/attest/tramos -- para no ensuciar estado on-chain real
// mientras se espera un fix externo (ver tareas.md, Paso 14).
import { payForRiskData } from '../agents/underwriter-agent.mjs';

const walletName = process.argv[2] || 'underwriter_A';
const assetId = process.argv[3] || 'invoice-batch-002';

try {
  const { riskData, paymentResponse } = await payForRiskData(walletName, assetId);
  console.log('riskData:', JSON.stringify(riskData));
  console.log('paymentResponse:', JSON.stringify(paymentResponse));
  if (paymentResponse?.success) {
    console.log('RESULTADO: x402 OK -- el settle contra WCSPR ya funciona.');
    process.exit(0);
  } else {
    console.log('RESULTADO: x402 SIGUE FALLANDO --', paymentResponse?.errorMessage || '(sin paymentResponse)');
    process.exit(1);
  }
} catch (err) {
  console.log('RESULTADO: x402 SIGUE FALLANDO (excepcion) --', err.message);
  process.exit(1);
}
