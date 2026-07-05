const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

async function main() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada en .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  console.log('Probando autenticacion con Gemini (sin tocar blockchain)...');
  console.log('Key configurada:', GEMINI_API_KEY.slice(0, 6) + '...' + GEMINI_API_KEY.slice(-4), `(${GEMINI_API_KEY.length} caracteres)`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Responde unicamente con la palabra OK.' }] }]
    })
  });

  console.log('HTTP status:', res.status);

  if (!res.ok) {
    const errText = await res.text();
    console.log('FAILURE - error de la API (key no impresa):');
    console.log(errText);
    process.exit(1);
  }

  const data = await res.json();
  const text = data.candidates[0].content.parts.map(p => p.text || '').join('');
  console.log('SUCCESS - respuesta de Gemini:', text.trim());
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
