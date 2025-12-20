import crypto from 'crypto';

// Encryption key from env (should be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.KYC_ENCRYPTION_KEY || process.env.JWT_SECRET?.slice(0, 32).padEnd(32, '0') || '00000000000000000000000000000000';
const IV_LENGTH = 16;

export const encrypt = (text) => {
  if (!text) return null;
  // If already encrypted (heuristic: contains ':', hex chars), might skip or re-encrypt? 
  // Mongoose getters/setters handle this automatically usually.
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error("Encryption failed", err);
    return null; // Should probably throw
  }
};

export const decrypt = (text) => {
  if (!text) return null;
  // Check if text looks encrypted (IV:Ciphertext)
  if (!text.includes(':')) return text; // Return as is if not encrypted (migration safety)

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    // console.error('Decryption error or Legacy Data:', err.message);
    return text; // Return original if decryption fails (fallback)
  }
};
