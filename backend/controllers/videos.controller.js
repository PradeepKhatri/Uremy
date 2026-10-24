import { pool } from "../db/connection.js";
import express from "express";
import { getVideoUrl } from "../r2.js";

// https://pub-ddc81404cfab4e5487e0c662bb4eb4d5.r2.dev/videos/lecture2.mp4

const getVideos = async (req, res) => {
  try {
    const userId = req.user.id;

    const { courseId } = req.params;

    // if (!Number.isInteger(courseId) || courseId <= 0) {
    //   return res.status(400).json({
    //     error: "Invalid course ID",
    //   });
    // }

    const courseResult = await pool.query(
      `SELECT
          c.id,
          c.title,
          c.description,
          c.price,
          c.currency,
          c.totalvideos,
          c.instructor,
          c.thumbnail,
          EXISTS (
            SELECT 1
            FROM enrollments e
            WHERE e.user_id = $1
              AND e.course_id = c.id
          ) AS "isEnrolled"
       FROM courses c
       WHERE c.id = $2`,
      [userId, courseId],
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    const course = courseResult.rows[0];
    let videos;

    if (course.isEnrolled) {
      const videoResults = await pool.query(
        `SELECT   
          v.id, 
          v.title,
          v.object_key, 
          COALESCE(p.status, 'pending') AS status,
          COALESCE(p.revisit, FALSE) AS revisit
        FROM videos v
        LEFT JOIN user_video_progress p 
          ON v.id = p.video_id AND p.user_id = $1
        WHERE course_id = $2
        ORDER BY v.id
      `,
        [userId, courseId],
      );

      videos = videoResults.rows;
    } else {
      const videoResults = await pool.query(
        `SELECT 
          v.id, 
          v.title
        FROM videos v
        WHERE course_id = $1
      `,
        [courseId],
      );

      videos = videoResults.rows;
    }

    return res.status(200).json({
      course,
      isEnrolled: course.isEnrolled,
      videos,
    });
  } catch (error) {
    res.status(500).send(`Error fetching videos ${error}`);
  }
};

const getVideo = async (req, res) => {
  try {
    const userId = req.user.id;

    const { courseId, videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ message: "Video ID is required" });
    }

    const { rows } = await pool.query(
      `SELECT
         v.id,
         v.title,
         v.object_key,
         COALESCE(p.status, 'pending') AS status,
         COALESCE(p.revisit, FALSE) AS revisit
       FROM videos v
       LEFT JOIN user_video_progress p
         ON p.video_id = v.id
         AND p.user_id = $3
       WHERE v.course_id = $1
     AND v.id = $2`,
      [Number(courseId), Number(videoId), userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    const { object_key, ...video } = rows[0];
    const url = await getVideoUrl(object_key);

    res.json({ ...video, url });
  } catch (error) {
    res.status(500).send(`Error fetching videos ${error}`);
  }
};

const USER_ID = 1;

const updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = Number(req.params.videoId);

    if (!Number.isInteger(videoId) || videoId <= 0) {
      return res.status(400).json({ error: "Invalid video id" });
    }

    const { status, revisit } = req.body;
    const fields = {};

    if (status !== undefined) {
      fields.status = status;
    }

    if (revisit !== undefined) {
      fields.revisit = revisit;
    }

    const video = await pool.query("SELECT 1 FROM videos WHERE id = $1", [
      videoId,
    ]);
    if (video.rowCount === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    const columns = Object.keys(fields);
    if (columns.length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const insertColumns = ["user_id", "video_id", ...columns];
    const insertValues = [
      userId,
      videoId,
      ...columns.map((column) => fields[column]),
    ];
    const insertPlaceholders = insertColumns
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const setClause = columns
      .map((column, index) => `${column} = EXCLUDED.${column}`)
      .join(", ");

    const { rows } = await pool.query(
      `INSERT INTO user_video_progress (${insertColumns.join(", ")})
       VALUES (${insertPlaceholders})
       ON CONFLICT (user_id, video_id)
       DO UPDATE SET ${setClause}
       RETURNING user_id, video_id, status, revisit`,
      insertValues,
    );

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export { getVideos, getVideo, updateProgress };
