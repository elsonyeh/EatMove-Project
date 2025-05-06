require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      );
    `);
    console.log("✅ Table 'users' created or already exists.");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  } finally {
    await pool.end();
  }
})();
