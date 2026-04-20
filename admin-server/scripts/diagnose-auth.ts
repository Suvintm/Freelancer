import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the local .env
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function diagnose() {
  console.log('--- 🔍 AUTH FORENSIC DIAGNOSTIC ---');
  console.log('Environment Path:', envPath);
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@suvix.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || '';
  
  console.log('Testing Email Identity:', email);
  console.log('Testing Password Length:', password.length);

  // Initialize DB
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Check SuperAdmin table
    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
    console.log('\n--- Table: SuperAdmin ---');
    if (superAdmin) {
      console.log('User Found: YES');
      console.log('Stored Hash Start:', superAdmin.password_hash.substring(0, 20) + '...');
      const match = await bcrypt.compare(password, superAdmin.password_hash);
      console.log('Bcrypt Match with .env password:', match ? '✅ SUCCESS' : '❌ FAILED');
    } else {
      console.log('User Found: NO');
    }

    // 2. Check AdminMember table
    const adminMember = await prisma.adminMember.findUnique({ where: { email } });
    console.log('\n--- Table: AdminMember ---');
    if (adminMember) {
      console.log('User Found: YES');
      console.log('Stored Hash Start:', adminMember.password_hash.substring(0, 20) + '...');
      const match = await bcrypt.compare(password, adminMember.password_hash);
      console.log('Bcrypt Match with .env password:', match ? '✅ SUCCESS' : '❌ FAILED');
    } else {
      console.log('User Found: NO');
    }

  } catch (err) {
    console.error('\n❌ Diagnostic Error:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

diagnose();
