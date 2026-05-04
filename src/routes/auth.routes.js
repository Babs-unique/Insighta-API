
import express from 'express';
import {
    initiateGitHubAuth,
    handleGitHubCallback,
    refreshAccessToken,
    logoutUser,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/github', initiateGitHubAuth);
router.get('/github/callback', handleGitHubCallback);

// Enforce POST method for refresh - use middleware to catch non-POST first
router.post('/refresh', refreshAccessToken);
router.all('/refresh', (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method Not Allowed',
            allowedMethods: ['POST']
        });
    }
    next();
});

// Enforce POST method for logout
router.post('/logout', logoutUser);
router.all('/logout', (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method Not Allowed',
            allowedMethods: ['POST']
        });
    }
    next();
});

export default router;