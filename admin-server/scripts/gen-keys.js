import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const envPath = path.join(__dirname, '..', '.env');
const privateKeyEscaped = privateKey.replace(/\r?\n/g, '\\n');
const publicKeyEscaped = publicKey.replace(/\r?\n/g, '\\n');

fs.appendFileSync(envPath, `\nJWT_PRIVATE_KEY="${privateKeyEscaped}"\nJWT_PUBLIC_KEY="${publicKeyEscaped}"\n`);
console.log('RSA Keys generated and appended to .env');
