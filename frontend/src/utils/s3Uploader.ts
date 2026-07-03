import { api } from '../api/client';

export const uploadMediaToS3 = async (file: File): Promise<string> => {
  try {
    // 1. Get pre-signed URL from our backend
    const signRes = await api.get('/media/signed-url', {
      params: {
        filename: file.name,
        contentType: file.type,
        type: 'IMAGE'
      }
    });

    if (!signRes.data.success) {
      throw new Error(signRes.data.message || 'Failed to get upload URL');
    }

    const { uploadUrl, mediaId, key } = signRes.data;

    // 2. Upload directly to S3 (no backend proxying, faster)
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

    // 3. Confirm upload so background processing can start if needed
    // And to mark the DB record as PROCESSING/COMPLETED
    await api.post('/media/confirm', { mediaId });

    // Return the storageKey so it can be resolved by smartResolveMediaUrl on the backend later
    return key;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw error;
  }
};
