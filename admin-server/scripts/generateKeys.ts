import { generateKeyPairSync } from 'crypto';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

function generateKeys() {
  console.log('🔐 Generating RS256 Key Pair...');

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Format keys into single line for .env or keep as is? 
  // NestJS ConfigService handles multin-line if properly quoted or we can use base64.
  // We will use standard PEM but escaped for .env
  const escapedPrivate = privateKey.replace(/\n/g, '\\n');
  const escapedPublic = publicKey.replace(/\n/g, '\\n');

  const envPath = join(process.cwd(), '.env');
  let envContent = '';
  try {
    envContent = readFileSync(envPath, 'utf8');
  } catch (e) {
    console.log('⚠️ .env not found, creating new one.');
  }

  // Remove existing keys if any
  envContent = envContent.replace(/^JWT_PRIVATE_KEY=.*$/m, '');
  envContent = envContent.replace(/^JWT_PUBLIC_KEY=.*$/m, '');

  const newEnv = envContent.trim() + 
    `\n\n# RS256 Keys Generated on ${new Date().toISOString()}\n` +
    `JWT_PRIVATE_KEY="${escapedPrivate}"\n` +
    `JWT_PUBLIC_KEY="${escapedPublic}"\n`;

  writeFileSync(envPath, newEnv);
  console.log('✅ Keys generated and saved to .env');
}

generateKeys();
