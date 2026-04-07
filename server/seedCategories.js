import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Role Categories & Sub-Categories...");

  // 1. Clear existing role data safely
  await prisma.userRoleMapping.deleteMany();
  await prisma.roleSubCategory.deleteMany();
  await prisma.roleCategory.deleteMany();

  const categories = [
    {
      name: "Normal User / Client",
      slug: "direct_client",
      icon: "briefcase",
      roleGroup: "CLIENT",
      description: "Discover and hire elite creators.",
      subCategories: ["General Hiring", "Project Management"]
    },
    {
      name: "YouTube Creator",
      slug: "yt_influencer",
      icon: "youtube",
      roleGroup: "PROVIDER",
      description: "Scale your content and brand.",
      subCategories: ["Vlog", "Tech Reviews", "Gaming", "Education"]
    },
    {
      name: "Fitness Pro",
      slug: "fitness_expert",
      icon: "activity",
      roleGroup: "PROVIDER",
      description: "Professional fitness coaching.",
      subCategories: ["Gym Trainer", "Yoga Instructor", "Nutritionist"]
    },
    {
      name: "Dancer",
      slug: "dancer",
      icon: "move",
      roleGroup: "PROVIDER",
      description: "Choreographers and performers.",
      subCategories: ["Hip Hop", "Classical", "Contemporary"]
    },
    {
      name: "Musician",
      slug: "musician",
      icon: "music",
      roleGroup: "PROVIDER",
      description: "Elite instrumentalists.",
      subCategories: ["Guitarist", "Pianist", "Drummer"]
    },
     {
      name: "Rental Services",
      slug: "rent_service",
      icon: "truck",
      roleGroup: "PROVIDER",
      description: "Rent top-tier professional gear.",
      subCategories: ["Camera Gear", "Lighting", "Studio Space"]
    }
  ];

  for (const cat of categories) {
    const createdCat = await prisma.roleCategory.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        roleGroup: cat.roleGroup,
        description: cat.description,
        subCategories: {
          create: cat.subCategories.map(sub => ({
            name: sub,
            slug: sub.toLowerCase().replace(/ /g, "_")
          }))
        }
      }
    });
    console.log(`✅ Created Category: ${createdCat.name}`);
  }

  console.log("✨ Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
