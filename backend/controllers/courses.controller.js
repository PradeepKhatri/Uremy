import { pool } from "../db/connection.js";

const GetCourses = async (req, res) => {
  try {
    const { rows } = await pool.query(`
        SELECT 
            id, title, description, price, currency, totalvideos, instructor, thumbnail
            FROM courses;
        `);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Courses not found" });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export { GetCourses };
