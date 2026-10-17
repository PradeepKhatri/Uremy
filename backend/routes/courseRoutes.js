import express from "express";
import { Router } from "express";
import { GetCourses } from "../controllers/courses.controller.js";

const router = express.Router();

router.get("/courses", GetCourses);

export default router;
