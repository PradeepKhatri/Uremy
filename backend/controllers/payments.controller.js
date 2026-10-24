import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import { pool } from "../db/connection.js";

const backendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
dotenv.config({ path: path.join(backendDirectory, ".env") });
dotenv.config({ path: path.join(backendDirectory, ".env.razorpay.local") });

let razorpayClient;

const getRazorpayClient = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay server credentials are not configured");
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayClient;
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const courseId = Number(req.body?.courseId);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({ error: "A valid courseId is required" });
    }

    const { rows } = await pool.query(
      "SELECT id, title, price, currency FROM courses WHERE id = $1",
      [courseId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const course = rows[0];
    const price = Number(course.price);
    const amount = Math.round(price * 100);
    const currency = String(course.currency || "INR").toUpperCase();

    if (
      !Number.isFinite(price) ||
      !Number.isSafeInteger(amount) ||
      amount < 100
    ) {
      return res
        .status(400)
        .json({ error: "Course price must be at least INR 1" });
    }

    const receipt = `c${courseId}u${userId}${Date.now()}`;
    const order = await getRazorpayClient().orders.create({
      amount,
      currency,
      receipt,
      notes: {
        courseId: String(courseId),
        userId: String(userId),
      },
    });

    await pool.query(
      `INSERT INTO payments
         (user_id, course_id, gateway_order_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'created')`,
      [userId, courseId, order.id, order.amount, order.currency],
    );

    return res.status(201).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res.status(500).json({ error: "Unable to create payment order" });
  }
};

const verifyPayment = async (req, res) => {
  const userId = req.user?.id;
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body || {};

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!orderId || !paymentId || !signature) {
    return res
      .status(400)
      .json({ error: "Payment verification fields are required" });
  }

  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  let client;
  let transactionStarted = false;

  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay server credentials are not configured");
    }

    const { rows } = await pool.query(
      `SELECT id, course_id, status, gateway_payment_id
       FROM payments
       WHERE gateway_order_id = $1 AND user_id = $2`,
      [orderId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Payment order not found" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res
        .status(400)
        .json({ error: "Payment signature verification failed" });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const lockedPayment = await client.query(
      `SELECT id, course_id, status, gateway_payment_id
       FROM payments
       WHERE gateway_order_id = $1 AND user_id = $2
       FOR UPDATE`,
      [orderId, userId],
    );

    if (lockedPayment.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({ error: "Payment order not found" });
    }

    const payment = lockedPayment.rows[0];

    if (payment.status === "paid" && payment.gateway_payment_id === paymentId) {
      await client.query("COMMIT");
      transactionStarted = false;
      return res.json({
        success: true,
        order_id: orderId,
        payment_id: paymentId,
      });
    }

    if (payment.status !== "created") {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(409).json({ error: "Payment order is not payable" });
    }

    await client.query(
      `UPDATE payments
       SET gateway_payment_id = $1, status = 'paid', updated_at = NOW()
       WHERE id = $2`,
      [paymentId, payment.id],
    );

    await client.query(
      `INSERT INTO enrollments (user_id, course_id, payment_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [userId, payment.course_id, payment.id],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.json({
      success: true,
      order_id: orderId,
      payment_id: paymentId,
      course_id: payment.course_id,
      enrolled: true,
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK");
    }
    console.error("Razorpay payment verification failed:", error);
    return res.status(500).json({ error: "Unable to verify payment" });
  } finally {
    client?.release();
  }
};

export { createOrder, verifyPayment };
