import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const PortfolioSchema = new mongoose.Schema({}, { strict: false });
const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema, 'portfolios');

async function listPortfolios() {
  const targetId = '69b917d9260fe88042551af1';

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`--- Listing Portfolios for ${targetId} ---`);
    
    const items = await Portfolio.find({ user: new mongoose.Types.ObjectId(targetId) });
    console.log(items.map(i => ({ title: i.title, uploadedAt: i.uploadedAt })));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

listPortfolios();
