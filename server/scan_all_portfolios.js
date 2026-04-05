import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const PortfolioSchema = new mongoose.Schema({}, { strict: false });
const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema, 'portfolios');

async function findAnythingBySuvin() {
  const suvinUuid = '6654021f-8c6b-41d6-a951-5acc40e1b549';

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- Searching ALL Portfolios ---');
    
    const countAll = await Portfolio.countDocuments({});
    console.log('Total portfolios in entire DB:', countAll);

    const matchUuid = await Portfolio.find({ user: suvinUuid });
    console.log(`Portfolios with UUID string [${suvinUuid}]:`, matchUuid.length);
    if (matchUuid.length > 0) {
      console.log('Sample match:', matchUuid[0]);
    }

    const matchUuidRaw = await Portfolio.find({ user: { $in: [suvinUuid, suvinUuid.toString()] } });
    console.log(`Portfolios with UUID (raw search):`, matchUuidRaw.length);

    const recent = await Portfolio.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('REALLY RECENT Portfolios (last 10):');
    console.log(recent.map(r => ({ user: r.user, title: r.title, createdAt: r.createdAt })));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

findAnythingBySuvin();
