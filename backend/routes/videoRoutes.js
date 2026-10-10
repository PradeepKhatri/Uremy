import express from "express";
import authenticate from "../middlewares/authenticate.js";
import {
  getVideo,
  getVideos,
  updateProgress,
} from "../controllers/videos.controller.js";

const router = express.Router();

router.get("/videos", authenticate, getVideos);
router.get("/video/:id", authenticate, getVideo);
router.patch("/videos/:id", authenticate, updateProgress);

export default router;
