import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pgClient = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function checkPic() {
  try {
    await pgClient.connect();
    const res = await pgClient.query('SELECT name, email, profile_picture FROM "users" WHERE name ILIKE $1', ['%Suvin%']);
    console.log('User Data:', res.rows);
  } finally {
    await pgClient.end();
  }
}

checkPic();
