import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from server dir
dotenv.config({ path: path.join(__dirname, '.env') });

// Simple TempFeed schema to just fix the DB without needing the full model definition here
const tempFeedSchema = new mongoose.Schema({
  type: String,
  videoUrl: String,
}, { strict: false });

const TempFeed = mongoose.model('TempFeed', tempFeedSchema, 'tempfeeds'); // Ensure collection name is correct. If it's different, mongoose handles it but providing it is safer. It might be tempfeeds

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
