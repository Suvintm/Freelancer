import communityService from '../services/communityService.js';

class CommunityController {
  async create(req, res, next) {
    try {
      const community = await communityService.createCommunity(req.user.id, req.body);
      res.status(201).json({ success: true, data: community });
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const community = await communityService.updateCommunity(req.params.id, req.body);
      res.status(200).json({ success: true, data: community });
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await communityService.deleteCommunity(req.params.id);
      res.status(200).json({ success: true, message: 'Community deleted' });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      // The community is already fetched by middleware if we use it, but for simple GET we can just return it
      const community = await communityService.getCommunityById(req.params.id);
      if (!community) return res.status(404).json({ success: false, message: 'Not found' });
      res.status(200).json({ success: true, data: community });
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const community = await communityService.getCommunityBySlug(req.params.slug);
      if (!community) return res.status(404).json({ success: false, message: 'Not found' });
      res.status(200).json({ success: true, data: community });
    } catch (err) {
      next(err);
    }
  }

  async getMyCommunities(req, res, next) {
    try {
      const { limit, cursor } = req.query;
      const data = await communityService.getMyCommunities(req.user.id, {
        limit: parseInt(limit) || 20,
        cursor,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  async discover(req, res, next) {
    try {
      const { limit, cursor } = req.query;
      const data = await communityService.getDiscoverCommunities({
        limit: parseInt(limit) || 20,
        cursor,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }
}

export default new CommunityController();
