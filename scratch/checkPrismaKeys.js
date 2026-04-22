import prisma from "../server/config/prisma.js";

async function run() {
  console.log("Keys on prisma object:", Object.keys(prisma).filter(k => !k.startsWith("_")));
  process.exit(0);
}

run();
