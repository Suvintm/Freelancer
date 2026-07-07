import { api } from '../api/client';

export const uploadMediaToS3 = async (
  file: File, 
  moduleContext: 'post' | 'reels' | 'youtube_post' | 'avatar' | 'poll' = 'post'
): Promise<string> => {
  const result = await uploadMediaDetailed(file, 'IMAGE', moduleContext);
  return result.key;
};

export const uploadMediaDetailed = async (
  file: File, 
  type: 'IMAGE' | 'VIDEO' = 'IMAGE',
  moduleContext: 'post' | 'reels' | 'youtube_post' | 'avatar' | 'poll' = 'post'
): Promise<{ key: string, mediaId: string }> => {
  try {
    // 1. Get pre-signed URL from our backend
    const signRes = await api.get('/media/signed-url', {
      params: {
        filename: file.name,
        contentType: file.type,
        type,
        module: moduleContext
      }
    });

    if (!signRes.data.success) {
      throw new Error(signRes.data.message || 'Failed to get upload URL');
    }

    const { uploadUrl, mediaId, key } = signRes.data;

    // 2. Upload directly to S3
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error('S3 upload failed');
    }

    // 3. Confirm upload
    await api.post('/media/confirm', { mediaId });

    return { key, mediaId };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw error;
  }
};
