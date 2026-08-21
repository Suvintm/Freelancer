import bioTemplateRepository from '../repositories/bioTemplateRepository.js';
import { redis, redisAvailable } from '../../../infrastructure/cache/redis.client.js';

const TEMPLATE_CACHE_KEY = 'bio:templates:all';
const CACHE_TTL = 3600; // 1 hour

export class BioTemplateService {
  /**
   * Seed full variety of production templates if database table is empty
   */
  async seedDefaultsIfEmpty() {
    const count = await bioTemplateRepository.countActive();
    if (count >= 8) return; // Already populated

    console.log('[BioTemplateService] 🌱 Seeding 11 production Link in Bio templates into database...');

    const defaults = [
      // 1. SuviX Signature Olive (Featured)
      {
        id: 'suvix-signature-olive',
        name: 'SuviX Signature Olive',
        description: 'Elite verified creator aesthetic with earthy olive styling, frosted glass cards, and verified badges.',
        category: 'creators',
        tier: 'free',
        thumbnail: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
        sortOrder: 1,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'solid',
            value: '#4D6234',
            color: '#4D6234',
            dominantColor: '#4D6234',
            blur: 0,
            overlay: { enabled: true, color: '#000000', opacity: 0.35 },
          },
          colors: {
            background: '#4D6234',
            primary: '#ffffff',
            secondary: '#4D6234',
            text: '#ffffff',
            textMuted: '#e2e8f0',
            cardBackground: 'rgba(255, 255, 255, 0.12)',
          },
          typography: { fontFamily: 'Plus Jakarta Sans', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'rounded', borderRadius: 14, shadow: 'medium', animation: 'none' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'medium' },
          cardVariant: 'solid',
        },
        blocksJson: [
          {
            id: 'tpl_header_1',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'SuviX Creator',
              subtitle: 'Building digital products, sharing knowledge and exploring tech.',
              badgeText: 'Creator & Innovator',
              variant: 'centered',
              avatarShape: 'circle',
              avatarSize: 'medium',
              alignment: 'center',
              showVerifiedBadge: true,
            },
          },
          {
            id: 'tpl_social_1',
            type: 'social-bar',
            schemaVersion: 1,
            order: 1,
            isVisible: true,
            config: {
              style: 'filled-circle',
              platforms: [
                { platform: 'instagram', url: 'https://instagram.com' },
                { platform: 'youtube', url: 'https://youtube.com' },
                { platform: 'twitter', url: 'https://x.com' },
                { platform: 'github', url: 'https://github.com' },
              ],
            },
          },
          {
            id: 'tpl_link_1',
            type: 'link-button',
            schemaVersion: 1,
            order: 2,
            isVisible: true,
            config: {
              text: 'Watch Latest YouTube Video',
              subtitle: 'New uploads every Tuesday & Thursday',
              url: 'https://youtube.com',
              variant: 'card',
              icon: 'youtube',
            },
          },
          {
            id: 'tpl_tip_1',
            type: 'tip-jar',
            schemaVersion: 1,
            order: 3,
            isVisible: true,
            config: {
              title: 'Support My Content ⚡',
              subtitle: 'Direct support helps me create more tutorials',
              suggestedAmounts: [5, 10, 25],
              currency: 'USD',
              buttonText: 'Buy Me a Coffee ☕',
            },
          },
        ],
      },

      // 2. Neon Cyberpunk (Streamer & Gaming)
      {
        id: 'neon-cyber',
        name: 'Neon Cyberpunk',
        description: 'High-energy dark mode theme with neon cyan & purple gradients for streamers and gamers.',
        category: 'creators',
        tier: 'pro',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        sortOrder: 2,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'gradient',
            value: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #000000 100%)',
            dominantColor: '#09090b',
            blur: 0,
            overlay: { enabled: true, color: '#000000', opacity: 0.3 },
          },
          colors: {
            background: '#09090b',
            primary: '#06b6d4',
            secondary: '#a855f7',
            text: '#ffffff',
            textMuted: '#94a3b8',
            cardBackground: 'rgba(15, 23, 42, 0.8)',
          },
          typography: { fontFamily: 'Space Grotesk', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'rounded', borderRadius: 14, shadow: 'medium', animation: 'glow' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'medium' },
          cardVariant: 'glass',
        },
        blocksJson: [
          {
            id: 'tpl_header_2',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'NeonViper Gaming',
              subtitle: 'Twitch Partner & FPS Competitor | Daily streams at 6PM EST',
              badgeText: '🔴 LIVE ON TWITCH',
              variant: 'story',
              avatarShape: 'squircle',
              avatarSize: 'medium',
              alignment: 'center',
              showVerifiedBadge: true,
            },
          },
          {
            id: 'tpl_link_2a',
            type: 'link-button',
            schemaVersion: 1,
            order: 1,
            isVisible: true,
            config: {
              text: 'Watch Live Stream',
              subtitle: 'Join 15,000+ viewers on Twitch',
              url: 'https://twitch.tv',
              variant: 'glass',
              animation: 'glow',
              icon: 'twitch',
            },
          },
          {
            id: 'tpl_link_2b',
            type: 'link-button',
            schemaVersion: 1,
            order: 2,
            isVisible: true,
            config: {
              text: 'Join the Discord Server',
              subtitle: 'Community hangouts & match alerts',
              url: 'https://discord.gg',
              variant: 'glass',
              icon: 'discord',
            },
          },
        ],
      },

      // 3. Minimal Monochrome
      {
        id: 'minimal-mono',
        name: 'Minimal Monochrome',
        description: 'Ultra-clean Swiss typography with crisp contrast for designers, developers, and writers.',
        category: 'minimal',
        tier: 'free',
        thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600&auto=format&fit=crop&q=80',
        sortOrder: 3,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'solid',
            value: '#ffffff',
            color: '#ffffff',
            dominantColor: '#ffffff',
            blur: 0,
            overlay: { enabled: false, color: '#000000', opacity: 0 },
          },
          colors: {
            background: '#ffffff',
            primary: '#09090b',
            secondary: '#71717a',
            text: '#09090b',
            textMuted: '#71717a',
            cardBackground: '#f4f4f5',
          },
          typography: { fontFamily: 'Inter', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'square', borderRadius: 8, shadow: 'none', animation: 'none' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'narrow' },
          cardVariant: 'outline',
        },
        blocksJson: [
          {
            id: 'tpl_header_3',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'Alex Vance',
              subtitle: 'Product Designer & Architect. Writing about interaction design and systems.',
              variant: 'compact',
              avatarShape: 'circle',
              avatarSize: 'small',
              alignment: 'left',
              showVerifiedBadge: true,
            },
          },
          {
            id: 'tpl_link_3a',
            type: 'link-button',
            schemaVersion: 1,
            order: 1,
            isVisible: true,
            config: {
              text: 'Design Portfolio (2026)',
              subtitle: 'Selected case studies in fintech and AI',
              url: 'https://suvix.in',
              variant: 'outline',
            },
          },
          {
            id: 'tpl_link_3b',
            type: 'link-button',
            schemaVersion: 1,
            order: 2,
            isVisible: true,
            config: {
              text: 'Substack Newsletter',
              subtitle: 'Read essays on software craft',
              url: 'https://substack.com',
              variant: 'outline',
            },
          },
        ],
      },

      // 4. Music Artist (Musician / Producer)
      {
        id: 'music-artist',
        name: 'Music & Beatmaker Pro',
        description: 'Dark acoustic aesthetic with embedded track players, streaming platforms, and tour tickets.',
        category: 'music',
        tier: 'pro',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        sortOrder: 4,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'solid',
            value: '#121212',
            color: '#121212',
            dominantColor: '#121212',
            blur: 0,
            overlay: { enabled: true, color: '#000000', opacity: 0.2 },
          },
          colors: {
            background: '#121212',
            primary: '#1db954',
            secondary: '#ff5500',
            text: '#ffffff',
            textMuted: '#a7a7a7',
            cardBackground: '#181818',
          },
          typography: { fontFamily: 'Space Grotesk', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'pill', borderRadius: 999, shadow: 'medium', animation: 'none' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'medium' },
          cardVariant: 'solid',
        },
        blocksJson: [
          {
            id: 'tpl_header_4',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'KAIRO (Producer)',
              subtitle: 'New EP "Midnight Echoes" streaming everywhere now.',
              badgeText: '🎵 NEW RELEASE OUT NOW',
              variant: 'banner',
              bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000',
              avatarShape: 'circle',
              avatarSize: 'large',
              alignment: 'center',
              showVerifiedBadge: true,
            },
          },
          {
            id: 'tpl_music_4',
            type: 'music-embed',
            schemaVersion: 1,
            order: 1,
            isVisible: true,
            config: {
              title: 'Stream "Midnight Echoes" on Spotify',
              url: 'https://open.spotify.com/album/4eLPsYPBmXABThSJ821sqY',
            },
          },
          {
            id: 'tpl_link_4',
            type: 'link-button',
            schemaVersion: 1,
            order: 2,
            isVisible: true,
            config: {
              text: 'World Tour Tickets 🎟️',
              subtitle: 'London, Berlin, Tokyo & New York',
              url: 'https://ticketmaster.com',
              variant: 'solid',
            },
          },
        ],
      },

      // 5. Commerce & Product Drop
      {
        id: 'ecommerce-drop',
        name: 'Streetwear & Merch Drop',
        description: 'High-converting shop template featuring live countdown timers and product catalog grids.',
        category: 'commerce',
        tier: 'pro',
        thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
        sortOrder: 5,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'solid',
            value: '#0f172a',
            color: '#0f172a',
            dominantColor: '#0f172a',
            blur: 0,
            overlay: { enabled: true, color: '#000000', opacity: 0.3 },
          },
          colors: {
            background: '#0f172a',
            primary: '#38bdf8',
            secondary: '#f43f5e',
            text: '#ffffff',
            textMuted: '#94a3b8',
            cardBackground: '#1e293b',
          },
          typography: { fontFamily: 'Plus Jakarta Sans', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'rounded', borderRadius: 12, shadow: 'medium', animation: 'none' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'medium' },
          cardVariant: 'solid',
        },
        blocksJson: [
          {
            id: 'tpl_header_5',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'AURA STUDIO',
              subtitle: 'Limited Edition Heavyweight Hoodies & Outerwear.',
              badgeText: '🔥 AUTUMN DROP LIVE',
              variant: 'centered',
              avatarShape: 'squircle',
              avatarSize: 'medium',
              alignment: 'center',
              showVerifiedBadge: true,
            },
          },
          {
            id: 'tpl_countdown_5',
            type: 'countdown',
            schemaVersion: 1,
            order: 1,
            isVisible: true,
            config: {
              title: 'Flash Sale Ends In:',
              targetDate: new Date(Date.now() + 86400000 * 3).toISOString(),
              endMessage: 'Drop is now sold out!',
            },
          },
          {
            id: 'tpl_product_5',
            type: 'product-card',
            schemaVersion: 1,
            order: 2,
            isVisible: true,
            config: {
              title: 'Oversized Cyber Hoodie (Black)',
              price: '$85.00',
              badge: 'Selling Fast',
              imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
              url: 'https://shopify.com',
            },
          },
        ],
      },

      // 6. Podcast Host & Audio
      {
        id: 'podcast-host',
        name: 'Podcast Show & Audio',
        description: 'Perfect for podcasters to showcase recent episodes, sponsor discounts, and newsletter signup.',
        category: 'podcast',
        tier: 'free',
        thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
        sortOrder: 6,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'solid',
            value: '#1e1b4b',
            color: '#1e1b4b',
            dominantColor: '#1e1b4b',
            blur: 0,
            overlay: { enabled: true, color: '#000000', opacity: 0.25 },
          },
          colors: {
            background: '#1e1b4b',
            primary: '#a855f7',
            secondary: '#38bdf8',
            text: '#ffffff',
            textMuted: '#cbd5e1',
            cardBackground: 'rgba(30, 27, 75, 0.7)',
          },
          typography: { fontFamily: 'Plus Jakarta Sans', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'rounded', borderRadius: 14, shadow: 'medium', animation: 'none' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'medium' },
          cardVariant: 'glass',
        },
        blocksJson: [
          {
            id: 'tpl_header_6',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'The Deep Dive Podcast',
              subtitle: 'Weekly conversations with founders, researchers, and creators.',
              badgeText: '🎙️ EPISODE 142 LIVE',
              variant: 'centered',
              avatarShape: 'circle',
              avatarSize: 'large',
              alignment: 'center',
              showVerifiedBadge: true,
            },
          },
          {
            id: 'tpl_email_6',
            type: 'email-capture',
            schemaVersion: 1,
            order: 1,
            isVisible: true,
            config: {
              heading: 'Get Episode Show Notes',
              subheading: 'Join 24,000+ readers getting key takeaways every Monday.',
              buttonText: 'Subscribe Free',
              placeholder: 'Enter your email address',
            },
          },
        ],
      },

      // 7. Tech Founder & SaaS
      {
        id: 'founder-saas',
        name: 'Tech Founder & SaaS',
        description: 'Modern split-layout designed for tech entrepreneurs, VC updates, and Product Hunt launches.',
        category: 'business',
        tier: 'free',
        thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
        sortOrder: 7,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'solid',
            value: '#0f172a',
            color: '#0f172a',
            dominantColor: '#0f172a',
            blur: 0,
            overlay: { enabled: true, color: '#000000', opacity: 0.2 },
          },
          colors: {
            background: '#0f172a',
            primary: '#3b82f6',
            secondary: '#10b981',
            text: '#ffffff',
            textMuted: '#94a3b8',
            cardBackground: '#1e293b',
          },
          typography: { fontFamily: 'Inter', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'rounded', borderRadius: 10, shadow: 'small', animation: 'none' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'medium' },
          cardVariant: 'solid',
        },
        blocksJson: [
          {
            id: 'tpl_header_7',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'David Chen',
              subtitle: 'Founder @ CloudScale (YC W24). Scaling distributed infrastructure for AI teams.',
              variant: 'split',
              avatarShape: 'squircle',
              avatarSize: 'medium',
              alignment: 'left',
              showVerifiedBadge: true,
            },
          },
          {
            id: 'tpl_link_7',
            type: 'link-button',
            schemaVersion: 1,
            order: 1,
            isVisible: true,
            config: {
              text: 'Try CloudScale Free (14-Day Trial)',
              subtitle: 'Deploy scalable Kubernetes clusters in 60s',
              url: 'https://cloudscale.io',
              variant: 'solid',
            },
          },
        ],
      },

      // 8. Botanical Pastel
      {
        id: 'elegance-flora',
        name: 'Elegance & Botanical',
        description: 'Soft organic tones and tranquil aesthetic for wellness coaches, bloggers, and lifestyle creators.',
        category: 'creators',
        tier: 'free',
        thumbnail: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
        sortOrder: 8,
        themeJson: {
          schemaVersion: 1,
          background: {
            type: 'solid',
            value: '#faf5ef',
            color: '#faf5ef',
            dominantColor: '#faf5ef',
            blur: 0,
            overlay: { enabled: false, color: '#000000', opacity: 0 },
          },
          colors: {
            background: '#faf5ef',
            primary: '#78716c',
            secondary: '#a8a29e',
            text: '#292524',
            textMuted: '#78716c',
            cardBackground: '#ffffff',
          },
          typography: { fontFamily: 'Plus Jakarta Sans', headingSize: 'large', bodySize: 'medium' },
          buttons: { style: 'pill', borderRadius: 999, shadow: 'small', animation: 'none' },
          spacing: { blockGap: 'medium', pagePadding: 'medium', maxWidth: 'medium' },
          cardVariant: 'solid',
        },
        blocksJson: [
          {
            id: 'tpl_header_8',
            type: 'profile-header',
            schemaVersion: 1,
            order: 0,
            isVisible: true,
            config: {
              title: 'Chloe Bennett',
              subtitle: 'Mindful living, plant-based recipes, and interior styling.',
              badgeText: '🌿 NEW SPRING RECIPES',
              variant: 'centered',
              avatarShape: 'circle',
              avatarSize: 'medium',
              alignment: 'center',
              showVerifiedBadge: true,
            },
          },
        ],
      },
    ];

    for (const t of defaults) {
      await bioTemplateRepository.upsert(t);
    }

    console.log(`[BioTemplateService] ✅ Successfully seeded ${defaults.length} production templates into PostgreSQL!`);
  }

  /**
   * Fetch all active templates with caching
   */
  async getTemplates(category = null) {
    // 1. Try Cache
    if (redisAvailable && !category) {
      try {
        const cached = await redis.get(TEMPLATE_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (err) {
        console.warn(`[BioTemplateService] Cache read error: ${err.message}`);
      }
    }

    // 2. Auto-seed if empty
    await this.seedDefaultsIfEmpty();

    // 3. Query Database
    const templates = await bioTemplateRepository.findAllActive(category);

    // 4. Populate Cache
    if (redisAvailable && !category) {
      try {
        await redis.set(TEMPLATE_CACHE_KEY, JSON.stringify(templates), 'EX', CACHE_TTL);
      } catch (err) {
        console.warn(`[BioTemplateService] Cache write error: ${err.message}`);
      }
    }

    return templates;
  }

  /**
   * Fetch a single template by ID
   */
  async getTemplateById(id) {
    return bioTemplateRepository.findById(id);
  }

  /**
   * Create or update a template (Admin only)
   */
  async saveTemplate(data) {
    const saved = await bioTemplateRepository.upsert(data);
    if (redisAvailable) {
      await redis.del(TEMPLATE_CACHE_KEY);
    }
    return saved;
  }

  /**
   * Delete a template (Admin only)
   */
  async deleteTemplate(id) {
    const deleted = await bioTemplateRepository.delete(id);
    if (redisAvailable) {
      await redis.del(TEMPLATE_CACHE_KEY);
    }
    return deleted;
  }
}

export default new BioTemplateService();
