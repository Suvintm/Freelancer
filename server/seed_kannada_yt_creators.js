import prisma from './config/prisma.js';
import { hashPassword } from './modules/auth/utils/password.js';

const DEFAULT_PASSWORD = 'suvixuser@123A';

const KANNADA_CREATORS = [
  {
    name: 'Naveen Kumar',
    username: 'naveen_tech_kannada',
    email: 'naveen.kumar@suvix.in',
    subCategorySlug: 'tech_reviews',
    channelName: 'Tech In Kannada',
    channelId: 'UC_tech_kannada_mock_123',
    customUrl: '@techinkannada',
    subscriberCount: 850000,
    videoCount: 420,
    viewCount: 75000000n,
    description: 'ಕನ್ನಡದಲ್ಲಿ ತಂತ್ರಜ್ಞಾನದ ಬಗ್ಗೆ ಮಾಹಿತಿ ಮತ್ತು ವಿಮರ್ಶೆಗಳು.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    videos: [
      {
        video_id: 'vid_tech_1',
        title: 'ಕನ್ನಡದಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಮೊಬೈಲ್‌ಗಳು 2026 - Best Phones Under ₹20,000!',
        description: '20,000 ರೂ ಒಳಗೆ ಕೊಳ್ಳಬಹುದಾದ ಅತ್ಯುತ್ತಮ ಸ್ಮಾರ್ಟ್‌ಫೋನ್‌ಗಳ ಪಟ್ಟಿ ಇಲ್ಲಿದೆ.',
        thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600',
        view_count: 120000n,
        duration_secs: 650,
        published_at: new Date('2026-06-15T12:00:00Z')
      },
      {
        video_id: 'vid_tech_2',
        title: 'ಈ ಹೊಸ ಗ್ಯಾಜೆಟ್ ನಿಮ್ಮ ಜೀವನ ಬದಲಾಯಿಸಬಹುದು! Unboxing & Review',
        description: 'ಇಂದಿನ ವಿಡಿಯೋದಲ್ಲಿ ಒಂದು ವಿಶಿಷ್ಟವಾದ ಗ್ಯಾಜೆಟ್ ಅನ್‌ಬಾಕ್ಸ್ ಮಾಡಲಿದ್ದೇವೆ.',
        thumbnail: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=600',
        view_count: 85000n,
        duration_secs: 420,
        published_at: new Date('2026-06-10T12:00:00Z')
      },
      {
        video_id: 'vid_tech_3',
        title: '5 ಸೂಪರ್ ಕಂಪ್ಯೂಟರ್ ಟಿಪ್ಸ್ ನಿಮಗೆ ಗೊತ್ತಿರಲೇಬೇಕು!',
        description: 'ನಿಮ್ಮ ಪಿಸಿಯನ್ನು ವೇಗಗೊಳಿಸಲು 5 ರಹಸ್ಯ ಕಿರುಕುಳಗಳು.',
        thumbnail: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=600',
        view_count: 230000n,
        duration_secs: 310,
        published_at: new Date('2026-06-01T12:00:00Z')
      }
    ]
  },
  {
    name: 'Sneha Gowda',
    username: 'sneha_kitchen_kannada',
    email: 'sneha.gowda@suvix.in',
    subCategorySlug: 'vlog',
    channelName: 'Kannada Adige Mane',
    channelId: 'UC_adige_mane_mock_456',
    customUrl: '@kannadaadigemane',
    subscriberCount: 340000,
    videoCount: 180,
    viewCount: 28000000n,
    description: 'ಸಾಂಪ್ರದಾಯಿಕ ಮತ್ತು ಸುಲಭ ಕನ್ನಡ ಅಡುಗೆ ವಿಧಾನಗಳು.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1490818621748-5b36a5c4b18c?auto=format&fit=crop&q=80&w=1200',
    videos: [
      {
        video_id: 'vid_food_1',
        title: 'ಮೃದುವಾದ ಮೈಸೂರು ಪಾಕ್ ಮಾಡುವುದು ಹೇಗೆ? Traditional Mysore Pak Reciepe',
        description: 'ಕೇವಲ 3 ಪದಾರ್ಥಗಳನ್ನು ಬಳಸಿ ಮನೆಯಲ್ಲೇ ಸುಲಭವಾಗಿ ಮೃದು ಮೈಸೂರು ಪಾಕ್ ಮಾಡಿ.',
        thumbnail: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600',
        view_count: 95000n,
        duration_secs: 480,
        published_at: new Date('2026-06-18T10:00:00Z')
      },
      {
        video_id: 'vid_food_2',
        title: 'ಹಳ್ಳಿ ಶೈಲಿಯ ನಾಟಿ ಕೋಳಿ ಸಾರು - Spicy Country Chicken Curry',
        description: 'ವಿಶೇಷ ಮಸಾಲೆ ರುಬ್ಬಿ ಮಾಡಿದ ಹಳ್ಳಿ ಶೈಲಿಯ ನಾಟಿ ಕೋಳಿ ಸಾರು.',
        thumbnail: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=600',
        view_count: 140000n,
        duration_secs: 720,
        published_at: new Date('2026-06-12T10:00:00Z')
      },
      {
        video_id: 'vid_food_3',
        title: 'ಬೆಳಗಿನ ಉಪಹಾರಕ್ಕೆ ದಿಢೀರ್ ರವೆ ಇಡ್ಲಿ - Instant Rava Idli In 15 Mins',
        description: 'ಸೋಡಾ ಬಳಸದೆ ಅತಿ ಸುಲಭವಾಗಿ ತಯಾರಿಸಬಹುದಾದ ರವೆ ಇಡ್ಲಿ ರೆಸಿಪಿ.',
        thumbnail: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600',
        view_count: 62000n,
        duration_secs: 350,
        published_at: new Date('2026-06-05T10:00:00Z')
      }
    ]
  },
  {
    name: 'Rakshith Shetty',
    username: 'rakshith_bro_vlogs',
    email: 'rakshith.shetty@suvix.in',
    subCategorySlug: 'vlog',
    channelName: 'Rakshith Bro Vlogs',
    channelId: 'UC_bro_vlogs_mock_789',
    customUrl: '@rakshithbrovlogs',
    subscriberCount: 1200000,
    videoCount: 520,
    viewCount: 145000000n,
    description: 'ಪ್ರಪಂಚವನ್ನು ಸುತ್ತಿರುವ ಕನ್ನಡದ ಮೊದಲ ಟ್ರಾವೆಲ್ ಬ್ಲಾಗರ್.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200',
    videos: [
      {
        video_id: 'vid_travel_1',
        title: 'ಗೋಕರ್ಣ ಬೀಚ್ ಬ್ಲಾಗ್ - Gokarna Travel Guide & Hidden Places!',
        description: 'ಗೋಕರ್ಣದಲ್ಲಿ ನೀವು ಭೇಟಿ ನೀಡಲೇಬೇಕಾದ ಸುಂದರವಾದ ಸ್ಥಳಗಳು ಮತ್ತು ವೆಚ್ಚಗಳ ವಿವರ.',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
        view_count: 450000n,
        duration_secs: 900,
        published_at: new Date('2026-06-20T08:00:00Z')
      },
      {
        video_id: 'vid_travel_2',
        title: 'ಊಟಿಯಲ್ಲಿ ಅತಿ ಕಡಿಮೆ ಬಜೆಟ್‌ನಲ್ಲಿ ಸುತ್ತುವುದು ಹೇಗೆ? Ooty Budget Trip',
        description: 'ಕಡಿಮೆ ಬಜೆಟ್‌ನಲ್ಲಿ ಊಟಿಯ ಅದ್ಭುತ ಸ್ಥಳಗಳ ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಿ.',
        thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=600',
        view_count: 320000n,
        duration_secs: 1100,
        published_at: new Date('2026-06-14T08:00:00Z')
      },
      {
        video_id: 'vid_travel_3',
        title: 'ಹಿಮಾಲಯದ ಅದ್ಭುತ ಹಿಮಪ್ರಪಾತ! - Himalayas Travel Vlog Part 1',
        description: 'ನನ್ನ ಜೀವಮಾನದ ಅತ್ಯಂತ ರೋಮಾಂಚಕ ಹಿಮಾಲಯ ಯಾನದ ರೋಡ್ ಟ್ರಿಪ್ ಅನುಭವ.',
        thumbnail: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=600',
        view_count: 850000n,
        duration_secs: 1500,
        published_at: new Date('2026-06-03T08:00:00Z')
      }
    ]
  },
  {
    name: 'Puneeth Raj',
    username: 'puneeth_gaming_kannada',
    email: 'puneeth.raj@suvix.in',
    subCategorySlug: 'gaming',
    channelName: 'Kannada Gaming Hub',
    channelId: 'UC_gaming_hub_mock_101',
    customUrl: '@kannadagaminghub',
    subscriberCount: 250000,
    videoCount: 380,
    viewCount: 19000000n,
    description: 'ಕನ್ನಡದಲ್ಲಿ ಪ್ರತಿದಿನ ಲೈವ್ ಗೇಮಿಂಗ್ ಮತ್ತು ಮನರಂಜನೆ.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
    videos: [
      {
        video_id: 'vid_game_1',
        title: 'GTA 5 ಕನ್ನಡದಲ್ಲಿ - ಈ ಮಿಷನ್ ತುಂಬಾ ಕಷ್ಟ ಇತ್ತು! (Ep 24)',
        description: 'ಜಿಟಿಎ 5 ಆಟದ ರೋಚಕ ಮಿಷನ್ ಕನ್ನಡ ಕಾಮೆಂಟರಿಯೊಂದಿಗೆ.',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
        view_count: 42000n,
        duration_secs: 1200,
        published_at: new Date('2026-06-19T14:00:00Z')
      },
      {
        video_id: 'vid_game_2',
        title: 'BGMI ನ್ಯೂ ಅಪ್‌ಡೇಟ್ ಲೈವ್ ಮ್ಯಾಚ್! - Clutch Gameplay Kannada',
        description: 'ಬಿಜಿಎಂಐ ಹೊಸ ಅಪ್‌ಡೇಟ್‌ನ ಲೈವ್ ಗೇಮ್ ಪ್ಲೇ ಮತ್ತು ಅತ್ಯುತ್ತಮ ಕ್ಷಣಗಳು.',
        thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=600',
        view_count: 31000n,
        duration_secs: 950,
        published_at: new Date('2026-06-11T14:00:00Z')
      },
      {
        video_id: 'vid_game_3',
        title: 'ನನ್ನ ಹೊಸ ಗೇಮಿಂಗ್ ಪಿಸಿ ಸೆಟಪ್ ಪ್ರವಾಸ! - Gaming Setup Tour 2026',
        description: 'ನನ್ನ ಸಂಪೂರ್ಣ ಗೇಮಿಂಗ್ ಕೊಠಡಿ ಮತ್ತು ಪಿಸಿ ಸ್ಪೆಸಿಫಿಕೇಷನ್‌ಗಳು.',
        thumbnail: 'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&q=80&w=600',
        view_count: 78000n,
        duration_secs: 580,
        published_at: new Date('2026-06-02T14:00:00Z')
      }
    ]
  },
  {
    name: 'Shruthi Hegde',
    username: 'shruthi_edu_kannada',
    email: 'shruthi.hegde@suvix.in',
    subCategorySlug: 'education',
    channelName: 'Kannada Jnana Degula',
    channelId: 'UC_jnana_degula_mock_202',
    customUrl: '@kannadajnanadegula',
    subscriberCount: 480000,
    videoCount: 310,
    viewCount: 39000000n,
    description: 'ಜ್ಞಾನ ಹೆಚ್ಚಿಸುವ ಉಪಯುಕ್ತ ವಿಷಯಗಳು ಮತ್ತು ಐತಿಹಾಸಿಕ ಕಥೆಗಳು.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    videos: [
      {
        video_id: 'vid_edu_1',
        title: 'ವಿಶ್ವದ 5 ಅತ್ಯಂತ ನಿಗೂಢ ಸ್ಥಳಗಳು! - 5 Most Mysterious Places on Earth',
        description: 'ವಿಜ್ಞಾನಿಗಳಿಗೂ ಇಂದಿಗೂ ಸವಾಲಾಗಿರುವ ಭೂಮಿಯ ಮೇಲಿನ ರಹಸ್ಯ ತಾಣಗಳ ಮಾಹಿತಿ.',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600',
        view_count: 150000n,
        duration_secs: 740,
        published_at: new Date('2026-06-17T09:00:00Z')
      },
      {
        video_id: 'vid_edu_2',
        title: 'ಹಂಪಿ ಇತಿಹಾಸ ಮತ್ತು ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ವೈಭವ - Hampi History Kannada',
        description: 'ನಮ್ಮ ಹೆಮ್ಮೆಯ ಐತಿಹಾಸಿಕ ನಗರ ಹಂಪಿಯ ಭವ್ಯ ಇತಿಹಾಸ ಮತ್ತು ಕಲಾ ಕೌಶಲ್ಯ.',
        thumbnail: 'https://images.unsplash.com/photo-1600100397990-24b32252c4b4?auto=format&fit=crop&q=80&w=600',
        view_count: 180000n,
        duration_secs: 820,
        published_at: new Date('2026-06-13T09:00:00Z')
      },
      {
        video_id: 'vid_edu_3',
        title: 'ಬ್ರಹ್ಮಾಂಡದ ರಹಸ್ಯಗಳು - ಬ್ಲ್ಯಾಕ್ ಹೋಲ್ ಎಂದರೇನು? - What is a Black Hole?',
        description: 'ಕನ್ನಡದಲ್ಲಿ ಬ್ಲ್ಯಾಕ್ ಹೋಲ್ ಮತ್ತು ಖಗೋಳಶಾಸ್ತ್ರದ ರೋಚಕ ವಿವರಣೆ.',
        thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600',
        view_count: 220000n,
        duration_secs: 600,
        published_at: new Date('2026-06-04T09:00:00Z')
      }
    ]
  }
];

async function main() {
  try {
    console.log("Looking up 'yt_influencer' category and its subcategories...");
    const category = await prisma.roleCategory.findFirst({
      where: { slug: 'yt_influencer' },
      include: { subCategories: true }
    });

    if (!category) {
      console.error("❌ 'yt_influencer' category not found in DB! Please seed categories first.");
      return;
    }

    console.log(`Found category: ${category.name} (${category.id})`);
    const subCategories = category.subCategories;
    if (subCategories.length === 0) {
      console.error("❌ No subcategories found for 'yt_influencer'!");
      return;
    }

    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    console.log("Password hashed successfully.");

    // YouTube Model dynamic resolver
    const ytModel = prisma.youtubeProfile || prisma.youTubeProfile || prisma.youtubeProfiles;
    if (!ytModel) {
      console.error("❌ YouTubeProfile model not found in Prisma Client!");
      return;
    }

    for (const creator of KANNADA_CREATORS) {
      console.log(`Inserting/Syncing user: ${creator.name} (${creator.email})`);

      // 1. Upsert User
      const user = await prisma.user.upsert({
        where: { email: creator.email },
        update: {
          password_hash: passwordHash,
          role: 'suvix_user',
          is_onboarded: true,
          is_verified: true,
        },
        create: {
          email: creator.email,
          username: creator.username,
          password_hash: passwordHash,
          role: 'suvix_user',
          is_onboarded: true,
          is_verified: true,
        }
      });

      // 2. Upsert UserProfile
      const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          name: creator.name,
          username: creator.username,
          categoryId: category.id,
          location_country: 'India',
          location_state: 'Karnataka',
          location_city: 'Bengaluru',
          mother_tongue: 'Kannada',
          profile_picture: creator.thumbnailUrl,
          cover_banner: creator.bannerUrl,
          bio: creator.description,
        },
        create: {
          userId: user.id,
          username: creator.username,
          name: creator.name,
          categoryId: category.id,
          location_country: 'India',
          location_state: 'Karnataka',
          location_city: 'Bengaluru',
          mother_tongue: 'Kannada',
          profile_picture: creator.thumbnailUrl,
          cover_banner: creator.bannerUrl,
          bio: creator.description,
        }
      });

      // 3. Clear existing role mappings for this profile and insert primary mappings
      await prisma.userRoleMapping.deleteMany({
        where: { profileId: profile.id }
      });

      // Find the matched subcategory ID or default to the first subcategory
      const matchedSubcat = subCategories.find(s => s.slug === creator.subCategorySlug) || subCategories[0];
      await prisma.userRoleMapping.create({
        data: {
          profileId: profile.id,
          roleSubCategoryId: matchedSubcat.id,
          isPrimary: true
        }
      });

      // 4. Ensure userStats exist
      await prisma.userStats.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      });

      // 5. Seed YouTube Profile
      await ytModel.deleteMany({
        where: { userId: user.id }
      });

      const ytProfile = await ytModel.create({
        data: {
          userId: user.id,
          is_primary: true,
          channel_id: creator.channelId,
          channel_name: creator.channelName,
          subscriber_count: creator.subscriberCount,
          video_count: creator.videoCount,
          thumbnail_url: creator.thumbnailUrl,
          banner_url: creator.bannerUrl,
          subCategoryId: matchedSubcat.id,
          language: 'Kannada',
          custom_url: creator.customUrl,
          description: creator.description,
          view_count: creator.viewCount,
          published_at: new Date('2018-05-12T00:00:00Z'),
          authority_score: 8.5
        }
      });

      // 6. Seed YouTube Videos
      await prisma.youTubeVideo.deleteMany({
        where: { youtubeProfileId: ytProfile.id }
      });

      for (const [index, video] of creator.videos.entries()) {
        await prisma.youTubeVideo.create({
          data: {
            user_id: user.id,
            channel_id: creator.channelId,
            video_id: video.video_id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail,
            duration_secs: video.duration_secs,
            view_count: video.view_count,
            published_at: video.published_at,
            position: index,
            is_latest: index === 0,
            youtubeProfileId: ytProfile.id
          }
        });
      }

      console.log(`✅ Completed setup for ${creator.name}`);
    }

    console.log("✨ All Kannada YouTube Creators seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding Kannada YouTube Creators:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
