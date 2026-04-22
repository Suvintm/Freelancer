import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import "dotenv/config";

// Initialize Prisma WITHOUT the adapter
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("🚀 Testing native Prisma update...");
    const res = await prisma.youTubeQuotaState.updateMany({
        where: { key_name: 'primary' },
        data: { used_units: { increment: 1 } }
    });
    console.log("✅ Success, count:", res.count);
    
    const status = await prisma.youTubeQuotaState.findUnique({ where: { key_name: "primary" } });
    console.log("📊 Resulting Balance:", status.remaining_units);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Native Prisma update failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
