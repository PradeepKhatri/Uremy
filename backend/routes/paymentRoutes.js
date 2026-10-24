import express from "express";
import authenticate from "../middlewares/authenticate.js";
import {
  createOrder,
  verifyPayment,
} from "../controllers/payments.controller.js";

const router = express.Router();

router.post("/create-order", authenticate, createOrder);
router.post("/verify-payment", authenticate, verifyPayment);

export default router;
