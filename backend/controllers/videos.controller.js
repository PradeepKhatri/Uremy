import { pool } from "../db/connection.js";
import express from "express";
import { getVideoUrl } from "../r2.js";

// https://pub-ddc81404cfab4e5487e0c662bb4eb4d5.r2.dev/videos/lecture2.mp4

const getVideos = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM videos ORDER BY id");

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).send(`Error fetching videos ${error}`);
  }
};

const getVideo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Video ID is required" });
    }

    const { rows } = await pool.query(
      `SELECT object_key, title FROM videos WHERE id = $1`,
      [id],
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
    const videoId = Number(req.params.id);

    if (!Number.isInteger(videoId) || videoId <= 0) {
      return res.status(400).json({ error: "Invalid video id" });
    }

    const { status, revisit } = req.body;
    const fields = {};

    if (status !== undefined) {
      fields.status = status;
    }

    if (revisit != undefined) {
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

    // $1 is the id, so the field values start at $2
    const setClause = columns.map((c, i) => `${c} = $${i + 2}`).join(", ");
    const values = [videoId, ...columns.map((c) => fields[c])];

    const { rows } = await pool.query(
      `UPDATE videos
       SET ${setClause}
       WHERE id = $1
       RETURNING id, status, revisit`,
      values,
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    console.log(rows);

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export { getVideos, getVideo, updateProgress };
