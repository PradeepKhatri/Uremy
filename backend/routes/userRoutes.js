import express from "express";
import { Router } from "express";
import { CreateAccount, Login } from "../controllers/users.controller.js";

const router = express.Router();

router.post("/signup", CreateAccount);
router.post("/login", Login);

export default router;
