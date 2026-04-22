import prisma from "../server/config/prisma.js";

async function run() {
  try {
    console.log("🚀 Testing simple update...");
    const res = await prisma.user.updateMany({
        where: { id: 'non-existent-id' },
        data: { email: 'test@example.com' }
    });
    console.log("✅ Success, count:", res.count);
    process.exit(0);
  } catch (err) {
    console.error("❌ Simple update failed:", err);
    process.exit(1);
  }
}

run();
