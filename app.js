import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimiter from "express-rate-limit";
import nameRoutes from "./src/routes/profile.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import connectDB from "./src/config/db.js";
import checkVersion from "./src/middleware/versionMiddleware.js";
import logger from "./src/middleware/logger.middleware.js";
dotenv.config();

const app = express();
connectDB();
app.use(logger);

const authLimiter = rateLimiter({
    windowMs: 60 * 1000, 
    max: process.env.AUTH_RATE_LIMIT || 10,
    message: {
        message: "Too many requests"
    }
});
const apiLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: process.env.API_RATE_LIMIT || 60,
    message: {
        message: "Too many requests"
    }
})

app.use(express.json());
app.use(cookieParser()); 
app.use(morgan("dev"));
app.use(cors({
    origin: process.env.CLIENT_URI || 'http://localhost:5173',
    credentials: true
}));
app.use('/api', checkVersion)
app.use('/api/auth', authLimiter);
app.use(apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api', nameRoutes);
app.get("/", (req,res) =>{
    res.json({message: "Welcome to NameIntel API"});
})

export default app;