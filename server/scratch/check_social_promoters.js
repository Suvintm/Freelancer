import prisma from '../config/prisma.js';

async function main() {
  console.log('Checking database for social_promoter...');
  
  const category = await prisma.roleCategory.findUnique({
    where: { slug: 'social_promoter' },
    include: {
      subCategories: true,
    }
  });

  if (!category) {
    console.log('social_promoter category not found in DB.');
    return;
  }

  console.log(`Category: ${category.name} (ID: ${category.id}, Slug: ${category.slug})`);
  console.log(`Subcategories count: ${category.subCategories.length}`);

  // Count profiles mapped to this category
  const profileCount = await prisma.userProfile.count({
    where: { categoryId: category.id }
  });
  console.log(`Profiles directly mapped to this category: ${profileCount}`);

  // Count user role mappings to subcategories
  for (const sub of category.subCategories) {
    const mappingCount = await prisma.userRoleMapping.count({
      where: { roleSubCategoryId: sub.id }
    });
    if (mappingCount > 0) {
      console.log(`- Subcategory "${sub.name}" (Slug: ${sub.slug}) has ${mappingCount} user mappings.`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
