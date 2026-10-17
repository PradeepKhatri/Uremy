import express from "express";
import authenticate from "../middlewares/authenticate.js";
import {
  getVideo,
  getVideos,
  updateProgress,
} from "../controllers/videos.controller.js";

const router = express.Router();

router.get("/videos/:courseId", authenticate, getVideos);
router.get("/video/:courseId/:videoId", authenticate, getVideo);
router.patch("/videos/:videoId", authenticate, updateProgress);

export default router;
