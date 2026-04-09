import prisma from "../config/prisma.js";

async function checkUserBio() {
  const allBios = await prisma.userProfile.findMany({
    select: { bio: true }
  });
  console.log("Found", allBios.length, "profiles.");
  console.log("Bios in DB (escaped):");
  allBios.forEach((b, i) => {
    if (b.bio) {
      console.log(`[${i}] ${JSON.stringify(b.bio)}`);
    }
  });
}

checkUserBio()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
