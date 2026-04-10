
//importing the dependencies
import express from "express";
import dotenv from "dotenv";


//importing the authRoutes and userRoutes from Routes(main route from the parent root)
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

dotenv.config();

// ✅ FIRST create app
const app = express();

// ✅ THEN middleware
app.use(express.json());

// ✅ THEN routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// ✅ THEN start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Express Server is running on http://localhost:${PORT}...`);
});