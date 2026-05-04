import { githubConfig } from "../config/github.js";
import env from "../config/env.js";
import { generateCodeChallenge, generateCodeVerifier } from "../utils/pkce.js";
import { getGitHubAccessToken, getGitHubUser } from "../services/github.service.js";
import { userLogin, refreshToken, logout } from "../services/auth.service.js";
import { generateState, getStateData, deleteState } from "../utils/state.js";
import User from "../models/user.model.js";

const initiateGitHubAuth = (req, res) => {
    try {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);
        const state = generateState(
            { codeVerifier, codeChallenge }
        );

        const authUrl = `${githubConfig.authorizationUrl}?client_id=${env.githubClientId}&redirect_uri=${encodeURIComponent(env.redirectUri)}&scope=read:user%20user:email&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                message: "Authorization URL generated successfully",
                authorizationUrl: authUrl,
                state,
                codeVerifier
            });
        }

        return res.redirect(authUrl);
    } catch (error) {
        console.error("Error initiating GitHub auth:", error);
        return res.status(500).json({
            success: false,
            message: "Error initiating authentication",
            error: error.message
        });
    }
};

const handleGitHubCallback = async (req, res) => {
    const { code, state } = req.query;

    // Validate required parameters
    if (!code) {
        return res.status(400).json({
            status: "error",
            success: false,
            message: "Missing code parameter"
        });
    }

    if (!state) {
        return res.status(400).json({
            status: "error",
            success: false,
            message: "Missing state parameter"
        });
    }

    // GET PKCE DATA FROM STATE STORE
    const stateData = getStateData(state);

    if (!stateData) {
        return res.status(400).json({
            status: "error",
            success: false,
            message: "Invalid or expired state parameter"
        });
    }

    const { codeVerifier, createdAt } = stateData;

    // EXPIRY CHECK - 5 minute window
    const MAX_AGE = 5 * 60 * 1000;

    if (Date.now() - createdAt > MAX_AGE) {
        deleteState(state);

        return res.status(400).json({
            status: "error",
            success: false,
            message: "State expired"
        });
    }

    try {
        // Exchange code for access token using PKCE
        const accessToken = await getGitHubAccessToken(code, codeVerifier);
        const githubUser = await getGitHubUser(accessToken);
        const authResult = await userLogin(githubUser);

        // CLEANUP AFTER SUCCESS
        deleteState(state);

        // Return tokens to client
        return res.json({
            success: true,
            message: "Authentication successful",
            access_token: authResult.accessToken,
            refresh_token: authResult.refreshToken,
            user: {
                id: authResult.user._id,
                username: authResult.user.username,
                email: authResult.user.email,
                role: authResult.user.role,
                avatar_url: authResult.user.avatar_url
            }
        });

    } catch (error) {
        console.error("OAuth error:", error);
        deleteState(state);

        return res.status(400).json({
            status: "error",
            success: false,
            message: error.message || "Authentication failed"
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized" 
            });
        }

        const user = await User.findById(req.user.userId).select('_id github_id username email avatar_url role');
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        return res.json({ 
            success: true, 
            data: user 
        });
    } catch (error) {
        console.error("Error fetching current user:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken: oldRefreshToken } = req.body;
        
        if (!oldRefreshToken) {
            return res.status(400).json({ 
                success: false, 
                message: "Refresh token is required" 
            });
        }

        const newTokens = await refreshToken(oldRefreshToken);
        return res.json({ 
            success: true, 
            message: "Access token refreshed successfully", 
            access_token: newTokens.accessToken,
            refresh_token: newTokens.refreshToken 
        });
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return res.status(401).json({ 
            success: false, 
            message: error.message || "Invalid refresh token" 
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ 
                success: false, 
                message: "Refresh token is required" 
            });
        }

        await logout(refreshToken);
        return res.json({ 
            success: true, 
            message: "Logout successful" 
        });
    } catch (error) {
        console.error("Error during logout", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error occurred while logging out" 
        });
    }
};

export { initiateGitHubAuth, handleGitHubCallback, refreshAccessToken, logoutUser, getCurrentUser };