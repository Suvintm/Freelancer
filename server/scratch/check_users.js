import prisma from "../config/prisma.js";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      profile: {
        select: {
          name: true,
          category: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      }
    }
  });

  console.log("Registered Users in DB:");
  users.forEach(u => {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Username: ${u.username} | Name: ${u.profile?.name || 'N/A'} | Role: ${u.profile?.category?.name || 'N/A'}`);
  });
}

main().catch(console.error);
