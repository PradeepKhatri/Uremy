import express from "express";
import { connectDB } from "./db/connection.js";
import videoRouter from "./routes/videoRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

app.use("/api", userRouter);

app.use("/api", videoRouter);

app.use("/", (req, res) => {
  res.send("API is working!!");
});

app.listen(8000, () => {
  console.log("App is running at port 8000");
});
