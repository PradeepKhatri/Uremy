import express from "express";
import { connectDB } from "./db/connection.js";
import videoRouter from "./routes/videoRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cors from "cors";

const app = express();

app.use(express.json());
allowedOrigins = process.env.FRONTEND_URL.split(",").map(s => s.trim())
app.use(cors({ origin: allowedOrigins }))

connectDB();

app.use("/api", userRouter);

app.use("/api", videoRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/", (req, res) => {
  res.send("API is working!!");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`App is running at port ${PORT}`);
});
