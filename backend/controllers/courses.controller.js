import { pool } from "../db/connection.js";

const GetEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
        SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.totalvideos, 
        c.instructor, 
        c.thumbnail,
        (
            SELECT COUNT(*)
            FROM videos v
            INNER JOIN user_video_progress p
            ON p.video_id = v.id
            WHERE v.course_id = c.id
            AND p.user_id = $1
            AND p.status = 'completed'
        ) AS "completedVideos"
        FROM courses c
        INNER JOIN enrollments e
        ON e.course_id = c.id
        WHERE e.user_id = $1
      `,
      [userId],
    );

    if (rows[0] === 0) {
      res.status(404).json("No Enrolled Courses");
    }

    res.status(200).json(rows);
  } catch (error) {
    // console.error("Error fetching enrolled courses:", error);
    res.status(500).json(`Error fetching Enrolled Courses ${error}`);
  }
};

const GetCourses = async (req, res) => {
  try {
    const { rows } = await pool.query(`
        SELECT 
            id, title, description, price, currency, totalvideos, instructor, thumbnail
            FROM courses ;
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

export { GetEnrolledCourses, GetCourses };
