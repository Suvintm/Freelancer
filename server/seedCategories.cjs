const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Role Categories...");
  
  try {
    await prisma.roleCategory.deleteMany();
    
    const categories = [
      { name: "Normal User / Client", slug: "direct_client", icon: "briefcase", roleGroup: "CLIENT" },
      { name: "YouTube Creator", slug: "yt_influencer", icon: "youtube", roleGroup: "PROVIDER" },
      { name: "Fitness Pro", slug: "fitness_expert", icon: "activity", roleGroup: "PROVIDER" },
      { name: "Dancer", slug: "dancer", icon: "move", roleGroup: "PROVIDER" },
      { name: "Musician", slug: "musician", icon: "music", roleGroup: "PROVIDER" },
      { name: "Rental Services", slug: "rent_service", icon: "truck", roleGroup: "PROVIDER" }
    ];

    for (const cat of categories) {
      await prisma.roleCategory.create({ data: cat });
    }
    
    console.log("✨ Seeding Complete!");
  } catch (err) {
    console.error("❌ Seeding Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
