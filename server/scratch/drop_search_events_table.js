import prisma from '../config/prisma.js';

async function dropTable() {
  try {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS youtube_search_events CASCADE');
    console.log('✅ Dropped youtube_search_events table from Postgres');
  } catch (error) {
    console.error('❌ Failed to drop table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

dropTable();
