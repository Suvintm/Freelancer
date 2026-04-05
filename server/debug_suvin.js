import pg from 'pg';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const pgClient = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

const PortfolioSchema = new mongoose.Schema({
  user: String,
  title: String
});
const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema, 'portfolios');

async function debug() {
  try {
    console.log('--- Connecting to PostgreSQL ---');
    await pgClient.connect();
    const res = await pgClient.query('SELECT id, name, email FROM "users" WHERE name ILIKE $1', ['%Suvin%']);
    console.log('Postgres Users Found:', res.rows);

    if (res.rows.length === 0) {
      console.log('No Suvin found in Postgres.');
    } else {
      const suvinId = res.rows[0].id;
      console.log('Targeting UUID:', suvinId);

      console.log('--- Connecting to MongoDB ---');
      await mongoose.connect(process.env.MONGO_URI);
      
      const count = await Portfolio.countDocuments({ user: suvinId });
      console.log(`Portfolios with exactly this UUID [${suvinId}]:`, count);

      const allPortfolios = await Portfolio.find({}).limit(100);
      console.log('Total portfolios in DB (sample):', allPortfolios.length);
      
      // Try to find ANY portfolio that might look like Suvin's (checking title or common formats)
      const potentialMatches = await Portfolio.find({ 
        $or: [
          { title: { $regex: 'Suvin', $options: 'i' } },
          { user: { $regex: suvinId, $options: 'i' } }
        ]
      });
      console.log('Potential Portfolio matches for Suvin:', potentialMatches);

      const distinctUsers = await Portfolio.distinct('user');
      console.log('Distinct user IDs found in Portfolios collection (first 20):', distinctUsers.slice(0, 20));

      // Check if any portfolio belongs to the OLD MongoDB ID of this user (if we can find it)
      // Actually, just listing them helps.
    }

  } catch (err) {
    console.error('Error during debug:', err);
  } finally {
    await pgClient.end();
    await mongoose.disconnect();
  }
}

debug();
