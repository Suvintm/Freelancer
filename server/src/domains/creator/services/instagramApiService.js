import axios from 'axios';
import logger from '../../../infrastructure/monitoring/logger.js';

class InstagramApiService {
    constructor() {
        this.appId = (process.env.META_APP_ID || '').trim();
        this.appSecret = (process.env.META_APP_SECRET || '').trim();
        this.redirectUri = (process.env.META_REDIRECT_URI || '').trim();
        this.version = (process.env.META_GRAPH_API_VERSION || 'v25.0').trim();
        this.baseUrl = `https://graph.instagram.com/${this.version}`;
        this.facebookBaseUrl = `https://graph.facebook.com/${this.version}`;
    }

    /**
     * Exchange OAuth code for a short-lived token, then for a long-lived token.
     */
    async exchangeCodeForToken(code) {
        try {
            const formData = new URLSearchParams();
            formData.append('client_id', this.appId);
            formData.append('client_secret', this.appSecret);
            formData.append('grant_type', 'authorization_code');
            formData.append('redirect_uri', this.redirectUri);
            
            // Clean code in case it has trailing spaces or Instagram's classic #_ hash attached
            const cleanCode = (code || '').replace(/#_$/, '').trim();
            formData.append('code', cleanCode);

            logger.info(`[InstagramAPI Debug] Exchanging code with payload: client_id=${this.appId}, redirect_uri=${this.redirectUri}, code=${cleanCode.substring(0, 10)}...`);

            // Use the modern graph.instagram.com endpoint for Instagram Business Login
            const response = await axios.post('https://api.instagram.com/oauth/access_token', formData);
            return response.data.access_token;
        } catch (error) {
            logger.error(`[InstagramAPI] Failed to exchange code for token: ${JSON.stringify(error.response?.data || error.message)}`);
            throw error;
        }
    }

    /**
     * Fetch Instagram creator profile details along with latest 15 media items
     */
    async fetchCreatorProfile(accessToken) {
        try {
            const profileUrl = `${this.baseUrl}/me?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,name,biography,website&access_token=${accessToken}`;
            
            const response = await axios.get(profileUrl);
            const data = response.data;
            
            if (response.headers['x-app-usage']) {
                logger.info(`[InstagramAPI] Rate Limit Usage: ${response.headers['x-app-usage']}`);
            }

            // Fetch latest 15 media posts/reels (safe fallback if 0 posts)
            let recentMedia = [];
            try {
                const mediaUrl = `${this.baseUrl}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=15&access_token=${accessToken}`;
                const mediaRes = await axios.get(mediaUrl);
                if (mediaRes.data?.data && Array.isArray(mediaRes.data.data)) {
                    recentMedia = mediaRes.data.data.map((m) => ({
                        id: m.id,
                        caption: m.caption || '',
                        mediaType: m.media_type || 'IMAGE',
                        thumbnailUrl: m.thumbnail_url || m.media_url || null,
                        permalink: m.permalink || `https://instagram.com/p/${m.id}`,
                        likeCount: m.like_count || 0,
                        commentsCount: m.comments_count || 0,
                        timestamp: m.timestamp || null,
                    }));
                }
            } catch (mediaErr) {
                logger.warn(`[InstagramAPI] Could not fetch media items: ${mediaErr.message}`);
            }

            return {
                accountId: data.id,
                handle: data.username,
                name: data.name || data.username,
                bio: data.biography || '',
                website: data.website || '',
                profilePictureUrl: data.profile_picture_url || null,
                followerCount: data.followers_count || 0,
                followingCount: data.follows_count || 0,
                mediaCount: data.media_count || 0,
                accountType: data.account_type || 'CREATOR',
                isPrimary: true,
                recentMedia,
            };
        } catch (error) {
            logger.error(`[InstagramAPI] Failed to fetch profile: ${error.response?.data?.error?.message || error.message}`);
            throw new Error('Failed to fetch Instagram profile details. Ensure your account is a Creator or Business account.');
        }
    }
}

export const instagramApiService = new InstagramApiService();
