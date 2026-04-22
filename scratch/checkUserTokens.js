import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkTokens() {
  const userId = "49d2bc03-1581-4755-96e7-531a5ce3f7dc";
  const tokens = await prisma.pushToken.findMany({
    where: { userId }
  });
  
  console.log(`Tokens for user ${userId}:`, JSON.stringify(tokens, null, 2));
  process.exit(0);
}

checkTokens();
