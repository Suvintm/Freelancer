import "dotenv/config";
import pg from 'pg';

const testConnection = async () => {
    console.log("Testing connection string:", process.env.DATABASE_URL);
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log("Attempting query...");
        const result = await pool.query('SELECT 1');
        console.log("Success! Result:", result.rows);
    } catch (error) {
        console.error("Connection failed with full error:");
        console.error(error);
    } finally {
        await pool.end();
    }
};

testConnection();
