import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("DB Connection Successful");
    client.release();
  } catch (error) {
    console.error(`Error connecting DB: ${error.message}`);
    process.exit(1);
  }
};
