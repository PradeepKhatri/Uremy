import express from "express";
import { Router } from "express";
import {
  GetCourses,
  GetEnrolledCourses,
} from "../controllers/courses.controller.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.get("/enrolledCourses", authenticate, GetEnrolledCourses);
router.get("/courses", GetCourses);

export default router;
