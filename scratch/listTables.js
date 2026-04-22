import prisma from "../server/config/prisma.js";

async function run() {
  try {
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log("Tables in database:", tables.map(t => t.table_name));
    process.exit(0);
  } catch (err) {
    console.error("Failed to list tables:", err);
    process.exit(1);
  }
}

run();
