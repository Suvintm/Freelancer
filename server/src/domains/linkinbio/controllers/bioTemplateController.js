import bioTemplateService from '../services/bioTemplateService.js';

export class BioTemplateController {
  /**
   * GET /api/linkinbio/templates
   * List all active templates (supports ?category=creators)
   */
  async getTemplates(req, res, next) {
    try {
      const { category } = req.query;
      const templates = await bioTemplateService.getTemplates(category);

      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
      return res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/linkinbio/templates/:id
   * Fetch single template details
   */
  async getTemplateById(req, res, next) {
    try {
      const { id } = req.params;
      const template = await bioTemplateService.getTemplateById(id);
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      return res.status(200).json({
        success: true,
        data: template,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/linkinbio/templates
   * Save or publish a template (Admin)
   */
  async saveTemplate(req, res, next) {
    try {
      const templateData = req.body;
      const saved = await bioTemplateService.saveTemplate(templateData);
      return res.status(200).json({
        success: true,
        message: 'Template saved successfully',
        data: saved,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/linkinbio/templates/:id
   * Remove template (Admin)
   */
  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      const result = await bioTemplateService.deleteTemplate(id);
      return res.status(200).json({
        success: true,
        message: 'Template deleted',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BioTemplateController();
