import bioPageService from '../services/bioPageService.js';

export class BioPageController {
  /**
   * GET /api/linkinbio/pages
   * List all bio pages for the authenticated user
   */
  async getPages(req, res, next) {
    try {
      const userId = req.user.id;
      const pages = await bioPageService.getUserPages(userId);
      return res.status(200).json({
        success: true,
        data: pages,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/linkinbio/pages/:id
   * Get single bio page with blocks and draft state
   */
  async getPageById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const page = await bioPageService.getPageById(id, userId);
      return res.status(200).json({
        success: true,
        data: page,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/linkinbio/pages
   * Create a new bio page from a starter template
   */
  async createPage(req, res, next) {
    try {
      const userId = req.user.id;
      const { templateId, title, slug, customDomain, draftBlocks, draftTheme, settings } = req.body;

      const newPage = await bioPageService.createPage(userId, {
        templateId,
        title,
        slug,
        customDomain,
        draftBlocks,
        draftTheme,
        settings,
      });

      return res.status(201).json({
        success: true,
        message: 'Bio page created successfully',
        data: newPage,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/linkinbio/pages/:id/draft
   * Debounced auto-save endpoint
   */
  async saveDraft(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, slug, description, customDomain, draftBlocks, draftTheme, settings, clientUpdatedAt } = req.body;

      const updatedPage = await bioPageService.saveDraft(id, userId, {
        title,
        slug,
        description,
        customDomain,
        draftBlocks,
        draftTheme,
        settings,
        clientUpdatedAt,
      });

      return res.status(200).json({
        success: true,
        message: 'Draft saved successfully',
        data: updatedPage,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/linkinbio/pages/:id/publish
   * Freeze draft into live published snapshot
   */
  async publishPage(req, res, next) {
    try {
      const userId = req.user.id;
      const username = req.user.username;
      const { id } = req.params;

      const publishedPage = await bioPageService.publishPage(id, userId, username);

      return res.status(200).json({
        success: true,
        message: 'Bio page published live successfully',
        data: publishedPage,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/linkinbio/pages/:id/set-primary
   * Switch the primary root public URL page
   */
  async setPrimary(req, res, next) {
    try {
      const userId = req.user.id;
      const username = req.user.username;
      const { id } = req.params;

      const result = await bioPageService.setPrimaryPage(userId, id, username);

      return res.status(200).json({
        success: true,
        message: 'Primary bio page updated',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/linkinbio/pages/:id
   * Delete a bio page
   */
  async deletePage(req, res, next) {
    try {
      const userId = req.user.id;
      const username = req.user.username;
      const { id } = req.params;

      const result = await bioPageService.deletePage(id, userId, username);

      return res.status(200).json({
        success: true,
        message: 'Bio page deleted',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/linkinbio/pages/migrate-legacy
   * Convert legacy PublicProfile into BioPage v2
   */
  async migrateLegacy(req, res, next) {
    try {
      const userId = req.user.id;
      const migratedPage = await bioPageService.migrateLegacyPublicProfile(userId);

      return res.status(200).json({
        success: true,
        message: 'Legacy profile successfully migrated to Bio Page v2',
        data: migratedPage,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BioPageController();
