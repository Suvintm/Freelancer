import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { TempFeed } from '../server/modules/temp-feed/models/TempFeed.js';

// Load env variables
dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const fixExistingVideos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const items = await TempFeed.find({ type: { $in: ['reel', 'yt_video'] } });
    console.log(`Found ${items.length} video feed items.`);

    let updatedCount = 0;
    for (const item of items) {
      if (item.videoUrl && item.videoUrl.includes('/upload/') && !item.videoUrl.includes('f_mp4')) {
        const rawUrl = item.videoUrl;
        const urlParts = rawUrl.split('/upload/');
        let pathPart = urlParts[1];
        
        // Remove existing transformation if any and force mp4
        if (pathPart.includes('/')) {
            // Check if there are existing transformations. 
            // In Cloudinary, transformations come right after /upload/ and don't contain a dot.
            const splitPath = pathPart.split('/');
            if (!splitPath[0].includes('.')) {
                splitPath.shift(); // remove existing transformation
                pathPart = splitPath.join('/');
            }
        }

        const lastDotIndex = pathPart.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          pathPart = pathPart.substring(0, lastDotIndex) + '.mp4';
        } else {
          pathPart += '.mp4';
        }
        
        const safeVideoUrl = `${urlParts[0]}/upload/f_mp4,vc_h264,ac_aac,q_auto/${pathPart}`;
        item.videoUrl = safeVideoUrl;
        await item.save();
        updatedCount++;
        console.log(`Updated video URL for item ${item._id}`);
      }
    }
    
    console.log(`Finished fixing existing videos. Updated ${updatedCount} items.`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing videos:', err);
    process.exit(1);
  }
};

fixExistingVideos();
