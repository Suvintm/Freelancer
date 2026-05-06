import communityService from '../services/communityService.js';

class CommunityController {
  async create(req, res) {
    try {
      const ownerId = req.user.id;
      const community = await communityService.createCommunity(ownerId, req.body);
      res.status(201).json({ success: true, data: community });
    } catch (error) {
      console.error('[CommunityController] Create error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBySlug(req, res) {
    try {
      const { slug } = req.params;
      const community = await communityService.getCommunityBySlug(slug);
      if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
      }
      res.json({ success: true, data: community });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async join(req, res) {
    try {
      const { communityId } = req.params;
      const userId = req.user.id;
      const membership = await communityService.joinCommunity(communityId, userId);
      res.json({ success: true, data: membership });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { communityId } = req.params;
      const senderId = req.user.id;
      const message = await communityService.sendMessage(communityId, senderId, req.body);
      
      // Emit socket event if available
      if (req.io) {
        req.io.to(`community:${communityId}`).emit('new_community_message', message);
      }

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMessages(req, res) {
    try {
      const { communityId } = req.params;
      const { limit, cursor } = req.query;
      const messages = await communityService.getMessages(communityId, parseInt(limit), cursor);
      res.json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyCommunities(req, res) {
    try {
      const userId = req.user.id;
      const communities = await communityService.getMyCommunities(userId);
      res.json({ success: true, data: communities });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { communityId } = req.params;
      const community = await communityService.getCommunityById(communityId);
      if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
      }
      res.json({ success: true, data: community });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new CommunityController();

