/**
 * migrate_content_split.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME DATA MIGRATION: Moves legacy rows from the old unified `posts` table
 * into the new dedicated `reels` and `youtube_posts` tables.
 *
 * Run AFTER `prisma migrate dev` has created the new tables/columns,
 * but BEFORE any code that enforces the new schema is deployed.
 *
 * Usage:
 *   node prisma/migrate_content_split.js
 */

import prisma from "../src/infrastructure/database/postgres.js";
import logger from "../src/infrastructure/monitoring/logger.js";

async function migrate() {
  logger.info("🚀 [MIGRATION] Starting content split migration...");

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Migrate YouTube posts (type = YOUTUBE_POST)
  // ─────────────────────────────────────────────────────────────────────────
  const youtubePosts = await prisma.$queryRaw`
    SELECT id, "user_id", caption, youtube_link, youtube_channel_id,
           visibility, like_count, created_at, updated_at
    FROM posts
    WHERE type = 'YOUTUBE_POST'
  `;

  logger.info(`[MIGRATION] Found ${youtubePosts.length} YouTube posts to migrate.`);

  for (const p of youtubePosts) {
    await prisma.$transaction(async (tx) => {
      // 1a. Insert into youtube_posts
      const newYtPost = await tx.$queryRaw`
        INSERT INTO youtube_posts (id, user_id, youtube_channel_id, caption, youtube_link,
                                   visibility, like_count, created_at, updated_at)
        VALUES (${p.id}, ${p.user_id}, ${p.youtube_channel_id}, ${p.caption},
                ${p.youtube_link}, ${p.visibility}::"Visibility", ${p.like_count},
                ${p.created_at}, ${p.updated_at})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;

      if (newYtPost.length > 0) {
        // 1b. Re-link media rows to youtube_post_id
        await tx.$executeRaw`
          UPDATE media SET youtube_post_id = ${p.id}, post_id = NULL
          WHERE post_id = ${p.id}
        `;
        logger.info(`  ✅ Migrated youtube_post: ${p.id}`);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Migrate Reels (is_reel = true OR type = 'VIDEO')
  // ─────────────────────────────────────────────────────────────────────────
  const reels = await prisma.$queryRaw`
    SELECT id, "user_id", caption, visibility, like_count, created_at, updated_at
    FROM posts
    WHERE is_reel = true OR type = 'VIDEO'
  `;

  logger.info(`[MIGRATION] Found ${reels.length} reels to migrate.`);

  for (const r of reels) {
    await prisma.$transaction(async (tx) => {
      // 2a. Insert into reels
      const newReel = await tx.$queryRaw`
        INSERT INTO reels (id, user_id, caption, visibility, like_count, view_count,
                           created_at, updated_at)
        VALUES (${r.id}, ${r.user_id}, ${r.caption}, ${r.visibility}::"Visibility",
                ${r.like_count}, 0, ${r.created_at}, ${r.updated_at})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;

      if (newReel.length > 0) {
        // 2b. Re-link media rows to reel_id
        await tx.$executeRaw`
          UPDATE media SET reel_id = ${r.id}, post_id = NULL
          WHERE post_id = ${r.id}
        `;
        logger.info(`  ✅ Migrated reel: ${r.id}`);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Delete migrated rows from posts
  // ─────────────────────────────────────────────────────────────────────────
  const deletedYt = await prisma.$executeRaw`
    DELETE FROM posts WHERE type = 'YOUTUBE_POST'
  `;
  const deletedReels = await prisma.$executeRaw`
    DELETE FROM posts WHERE is_reel = true OR type = 'VIDEO'
  `;

  logger.info(`[MIGRATION] Deleted ${deletedYt} youtube_post rows from posts table.`);
  logger.info(`[MIGRATION] Deleted ${deletedReels} reel rows from posts table.`);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Migrate Polls — set userId from linked post
  // ─────────────────────────────────────────────────────────────────────────
  const pollsMigrated = await prisma.$executeRaw`
    UPDATE polls p
    SET user_id = (SELECT user_id FROM posts WHERE id = p.post_id)
    WHERE user_id IS NULL AND post_id IS NOT NULL
  `;
  logger.info(`[MIGRATION] Updated user_id on ${pollsMigrated} polls.`);

  logger.info("🎉 [MIGRATION] Content split migration complete.");
}

migrate()
  .catch((e) => {
    logger.error(`[MIGRATION] FAILED: ${e.message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
