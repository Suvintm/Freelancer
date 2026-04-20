import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing in .env');
  process.exit(1);
}

// 1. Initialize native PG pool (v7 requirement)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Wrap it in the Prisma PG adapter
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma Client with adapter
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12;

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@suvix.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuvixMasterPass2026!';
  const name = 'Super Administrator';

  console.log(`🚀 Seeding SuperAdmin: ${email}`);

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.superAdmin.upsert({
    where: { email },
    update: {
      password_hash: hashedPassword,
      is_active: true,
    },
    create: {
      email,
      password_hash: hashedPassword,
      name,
      role: 'superadmin',
      is_active: true,
    },
  });

  console.log('✅ SuperAdmin seeded successfully with Argon2id.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
