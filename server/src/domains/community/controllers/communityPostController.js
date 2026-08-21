import communityPostService from '../services/communityPostService.js';
import { communityPostRepository } from '../repositories/communityPost.repository.js';

export const listPosts = async (req, res, next) => {
  try {
    const { cursor, limit } = req.query;
    const data = await communityPostService.listPosts(req.params.id, req.user.id, {
      cursor,
      limit: parseInt(limit) || 20,
    });
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const post = await communityPostService.createPost(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

export const getPost = async (req, res, next) => {
  try {
    const post = await communityPostRepository.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    await communityPostRepository.incrementViewCount(req.params.postId);
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await communityPostRepository.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    
    // Author or ADMIN/MOD can delete
    if (post.authorId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.membership?.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await communityPostRepository.softDelete(req.params.postId);
    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

export const pinPost = async (req, res, next) => {
  try {
    await communityPostRepository.unpinAll(req.params.id);
    const post = await communityPostRepository.pin(req.params.postId);
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

export const reactToPost = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const counts = await communityPostService.reactToPost(req.params.postId, req.user.id, emoji);
    res.status(200).json({ success: true, data: counts });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};
