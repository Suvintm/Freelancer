import { api } from '../../api/client';
import type { BioPage } from '../types/page.types';

export const bioApiService = {
  /**
   * Fetch all bio pages for the authenticated user
   */
  async getPages(): Promise<BioPage[]> {
    const res = await api.get('/linkinbio/pages');
    return res.data.data;
  },

  /**
   * Fetch single bio page by ID
   */
  async getPageById(id: string): Promise<BioPage> {
    const res = await api.get(`/linkinbio/pages/${id}`);
    return res.data.data;
  },

  /**
   * Create a new bio page from template
   */
  async createPage(data: Partial<BioPage>): Promise<BioPage> {
    const res = await api.post('/linkinbio/pages', data);
    return res.data.data;
  },

  /**
   * Save draft state to cloud database (Single atomic write with optimistic concurrency check)
   */
  async saveDraft(id: string, updates: Partial<BioPage> & { clientUpdatedAt?: string }): Promise<BioPage> {
    const res = await api.put(`/linkinbio/pages/${id}/draft`, updates);
    return res.data.data;
  },

  /**
   * Publish page to live public snapshot
   */
  async publishPage(id: string): Promise<BioPage> {
    const res = await api.post(`/linkinbio/pages/${id}/publish`);
    return res.data.data;
  },

  /**
   * Set a page as the primary active root bio URL
   */
  async setPrimaryPage(id: string): Promise<{ success: boolean; primaryPageId: string }> {
    const res = await api.put(`/linkinbio/pages/${id}/set-primary`);
    return res.data.data;
  },

  /**
   * Delete a bio page
   */
  async deletePage(id: string): Promise<{ success: boolean; deletedId: string }> {
    const res = await api.delete(`/linkinbio/pages/${id}`);
    return res.data.data;
  },

  /**
   * Migrate legacy PublicProfile into BioPage v2
   */
  async migrateLegacy(): Promise<BioPage> {
    const res = await api.post('/linkinbio/pages/migrate-legacy');
    return res.data.data;
  },

  /**
   * Fetch active templates from database with optional category filter
   */
  async getTemplates(category?: string): Promise<any[]> {
    const query = category && category !== 'all' ? `?category=${category}` : '';
    const res = await api.get(`/linkinbio/templates${query}`);
    return res.data.data;
  },

  /**
   * Save or publish a new template to database (Admin)
   */
  async saveTemplate(templateData: any): Promise<any> {
    const res = await api.post('/linkinbio/templates', templateData);
    return res.data.data;
  },

  /**
   * Fetch public visitor profile
   */
  async getPublicProfile(username: string, slug?: string) {
    const targetSlug = slug ? `/${slug}` : '';
    const res = await api.get(`/linkinbio/public/${username}${targetSlug}`);
    return res.data.data;
  },

  /**
   * Track visitor view impression (fire and forget)
   */
  async trackView(pageId: string, visitorId?: string, referrer?: string) {
    return api.post('/linkinbio/track/view', {
      pageId,
      visitorId,
      referrer: referrer || document.referrer || '',
    }).catch(() => {});
  },

  /**
   * Track link / product click event (fire and forget)
   */
  async trackClick(pageId: string, blockId?: string, visitorId?: string, referrer?: string) {
    return api.post('/linkinbio/track/click', {
      pageId,
      blockId,
      visitorId,
      referrer: referrer || document.referrer || '',
    }).catch(() => {});
  },

  /**
   * Subscribe to creator newsletter
   */
  async subscribe(pageId: string, email: string, source?: string) {
    const res = await api.post(`/linkinbio/subscribe/${pageId}`, {
      email,
      source: source || 'email-capture',
    });
    return res.data;
  },

  /**
   * Create Razorpay Tip order
   */
  async createTipOrder(data: {
    pageId: string;
    amount: number;
    currency?: string;
    tipMessage?: string;
    visitorName?: string;
  }) {
    const res = await api.post('/linkinbio/tips/create-order', data);
    return res.data.data;
  },

  /**
   * Verify Razorpay Tip signature
   */
  async verifyTip(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    pageId?: string;
    amount?: number;
    currency?: string;
  }) {
    const res = await api.post('/linkinbio/tips/verify', data);
    return res.data;
  },

  /**
   * Synchronously generate or regenerate personalized QR code
   */
  async generateQr(options?: { slug?: string; color?: string; bg?: string }) {
    const res = await api.post('/linkinbio/qr/generate', options || {});
    return res.data.data;
  },

  /**
   * Fetch creator's QR status and metadata
   */
  async getQrStatus() {
    const res = await api.get('/linkinbio/qr/status');
    return res.data.data;
  },

  /**
   * Fetch aggregate overview metrics for creator dashboard
   */
  async getAnalyticsOverview(): Promise<{
    totalViews: number;
    totalClicks: number;
    averageCtr: number;
    viewsTrend: string;
    clicksTrend: string;
    topLink?: { title: string; clicks: number } | null;
  }> {
    const res = await api.get('/linkinbio/analytics/overview');
    return res.data.data;
  },
};
