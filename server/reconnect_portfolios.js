import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const PortfolioSchema = new mongoose.Schema({ user: mongoose.Schema.Types.Mixed }, { strict: false });
const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema, 'portfolios');

async function reconnect() {
  const suvinUuid = '6654021f-8c6b-41d6-a951-5acc40e1b549';
  const oldIds = [
    '69b8f1898690e31849924d3a',
    '69b917d9260fe88042551af1'
  ];

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`--- Reconnecting Portfolios to UUID [${suvinUuid}] ---`);

    for (const oldId of oldIds) {
      const result = await Portfolio.updateMany(
        { user: new mongoose.Types.ObjectId(oldId) },
        { $set: { user: suvinUuid } }
      );
      console.log(`Updated items for old ID [${oldId}]:`, result.modifiedCount);
    }

    const finalCount = await Portfolio.countDocuments({ user: suvinUuid });
    console.log(`Final Portfolio Count for Suvin UUID:`, finalCount);

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await mongoose.disconnect();
  }
}

reconnect();
