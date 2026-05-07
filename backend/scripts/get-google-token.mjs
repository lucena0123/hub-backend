/**
 * Script para gerar um novo Google OAuth2 Refresh Token.
 *
 * Uso:
 *   node backend/scripts/get-google-token.mjs
 *
 * 1. Abre uma URL no browser
 * 2. Você autoriza o acesso
 * 3. Cola o código aqui
 * 4. Recebe o novo refresh_token para colocar no .env
 */

import { google } from 'googleapis';
import * as readline from 'readline';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET antes de executar este script.');
  process.exit(1);
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
];

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = auth.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // força geração de novo refresh_token
});

console.log('\n=== PASSO 1: Abra esta URL no browser ===\n');
console.log(authUrl);
console.log('\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('=== PASSO 2: Cole aqui o código de autorização: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await auth.getToken(code.trim());
    console.log('\n✅ Sucesso! Adicione ao seu .env:\n');
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    if (tokens.access_token) {
      console.log(`\n(access_token temporário: ${tokens.access_token.slice(0, 40)}...)`);
    }
  } catch (err) {
    console.error('\n❌ Erro ao trocar o código:', err.message);
  }
});
