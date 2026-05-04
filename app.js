import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimiter from "express-rate-limit";
import nameRoutes from "./src/routes/profile.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import connectDB from "./src/config/db.js";
import checkVersion from "./src/middleware/versionMiddleware.js";
import logger from "./src/middleware/logger.middleware.js";
dotenv.config();

const app = express();
connectDB();
app.use(logger);

// Strict auth rate limiter for GitHub OAuth endpoint
const githubOAuthLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: process.env.AUTH_RATE_LIMIT || 10,
    message: {
        success: false,
        message: "Too many authentication requests, please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        // Use IP address and username if available
        return req.ip || req.connection.remoteAddress;
    }
});

// General auth rate limiter
const authLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: process.env.AUTH_RATE_LIMIT || 10,
    message: {
        success: false,
        message: "Too many requests"
    }
});

// General API rate limiter
const apiLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: process.env.API_RATE_LIMIT || 60,
    message: {
        success: false,
        message: "Too many requests"
    }
});

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors({
    origin: process.env.CLIENT_URI || 'http://localhost:5173',
    credentials: true
}));

// Apply strict rate limiter to GitHub OAuth endpoint
app.get('/auth/github', githubOAuthLimiter);
app.get('/api/auth/github', githubOAuthLimiter);

// Apply auth routes with general auth limiter
app.use('/auth', authLimiter, authRoutes);
app.use('/api/auth', authLimiter, authRoutes);

// API version check and other routes
app.use('/api', checkVersion);
app.use('/api', apiLimiter);
app.use('/api', userRoutes);
app.use('/api', nameRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Insighta API" });
});

export default app;