import prisma from '../config/prisma.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const run = async () => {
  const sqlFile = join(__dirname, '../prisma/migrations/search_engine_upgrade.sql');
  const rawSql = readFileSync(sqlFile, 'utf8');

  // Split on semicolons but preserve function bodies ($$...$$)
  // We'll run statements one at a time, skipping comments
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  for (const line of rawSql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue; // skip comment lines

    if (trimmed.includes('$$')) inDollarQuote = !inDollarQuote;

    current += line + '\n';

    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim().replace(/;$/, '').trim();
      if (stmt.length > 0) statements.push(stmt);
      current = '';
    }
  }

  console.log(`\n🚀 Running ${statements.length} SQL statements...\n`);

  let ok = 0;
  let warn = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 70);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`✅ [${i + 1}/${statements.length}] ${preview}`);
      ok++;
    } catch (e) {
      console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}`);
      console.log(`   → ${e.message.split('\n')[0]}\n`);
      warn++;
    }
  }

  console.log(`\n✨ Migration complete. ${ok} OK, ${warn} warnings.`);
  await prisma.$disconnect();
};

run().catch((e) => {
  console.error('❌ Fatal:', e.message);
  process.exit(1);
});
