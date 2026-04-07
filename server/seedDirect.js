import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log("🌱 Seeding Role Categories & Sub-Categories (Direct PG)...");
  
  try {
    await client.connect();
    
    // Clear existing safely
    await client.query('DELETE FROM user_role_mappings');
    await client.query('DELETE FROM role_sub_categories');
    await client.query('DELETE FROM role_categories');

    const categories = [
      {
        name: "YouTube Creator",
        slug: "yt_influencer",
        icon: "youtube",
        role_group: "PROVIDER",
        subCategories: ["Vlog", "Tech Reviews", "Gaming", "Education", "Lifestyle"]
      },
      {
        name: "Fitness Pro",
        slug: "fitness_expert",
        icon: "activity",
        role_group: "PROVIDER",
        subCategories: ["Gym Trainer", "Yoga Instructor", "Nutritionist"]
      },
      {
        name: "Normal User / Client",
        slug: "direct_client",
        icon: "briefcase",
        role_group: "CLIENT",
        subCategories: ["Business", "Personal", "Individual"]
      }
    ];

    for (const cat of categories) {
      // 1. Insert Category
      const catRes = await client.query(
        'INSERT INTO role_categories (id, name, slug, icon, role_group) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id',
        [cat.name, cat.slug, cat.icon, cat.role_group]
      );
      const catId = catRes.rows[0].id;
      console.log(`✅ Category: ${cat.name}`);

      // 2. Insert Sub-categories
      for (const sub of cat.subCategories) {
        await client.query(
          'INSERT INTO role_sub_categories (id, role_category_id, name, slug) VALUES (gen_random_uuid(), $1, $2, $3)',
          [catId, sub, sub.toLowerCase().replace(/ /g, "_")]
        );
        console.log(`   └─ Sub-category: ${sub}`);
      }
    }
    
    console.log("✨ Seeding Complete!");
  } catch (err) {
    console.error("❌ Seeding Failed:", err);
  } finally {
    await client.end();
  }
}

main();
