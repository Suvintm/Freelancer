import prisma from './src/infrastructure/database/postgres.js';

async function main() {
  console.log("=== REELS ===");
  const reels = await prisma.reel.findMany({
    include: { media: true }
  });
  console.log(JSON.stringify(reels, null, 2));

  console.log("=== POSTS ===");
  const posts = await prisma.post.findMany({
    include: { media: true }
  });
  console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
