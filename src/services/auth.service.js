import tokenModel from "../models/token.model.js";
import User from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const userLogin = async (githubUser) => {
    let user = await User.findOne({ github_id: githubUser.id });

    if (!user) {
        const existingUserCount = await User.countDocuments();
        const defaultRole = existingUserCount === 0 ? 'admin' : 'analyst';

        user = new User({
            github_id: githubUser.id,
            username: githubUser.login,
            email: githubUser.email,
            avatar_url: githubUser.avatar_url,
            role: defaultRole
        });
        user.last_login_at = new Date();
        await user.save();
    } else {
        // Update last login time for existing users
        user.last_login_at = new Date();
        await user.save();
    }

    const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });

    // Set expiration to 7 days
    const tokenDoc = new tokenModel({
        userId: user._id.toString(),
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false
    });
    await tokenDoc.save();

    return {
        user,
        accessToken,
        refreshToken: newRefreshToken
    };
};

const refreshToken = async (oldRefreshToken) => {
    if (!oldRefreshToken) {
        throw new Error("Refresh token is required");
    }

    const verified = verifyRefreshToken(oldRefreshToken);
    const tokenDoc = await tokenModel.findOne({
        refreshToken: oldRefreshToken,
        isRevoked: false,
        expiresAt: { $gt: Date.now() }
    });

    if (!tokenDoc) {
        throw new Error("Invalid or expired refresh token");
    }

    // Revoke old token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const user = await User.findById(verified.userId);
    if (!user) {
        throw new Error("User not found");
    }

    const newAccessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });

    // Create new token document with 7 day expiration
    const newTokenDoc = new tokenModel({
        userId: user._id.toString(),
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false
    });
    await newTokenDoc.save();

    return { 
        accessToken: newAccessToken, 
        refreshToken: newRefreshToken 
    };
};

const logout = async (refreshTokenValue) => {
    if (!refreshTokenValue) {
        throw new Error("Refresh token is required");
    }

    const tokenDoc = await tokenModel.findOne({
        refreshToken: refreshTokenValue,
        isRevoked: false,
        expiresAt: { $gt: Date.now() }
    });

    if (tokenDoc) {
        tokenDoc.isRevoked = true;
        await tokenDoc.save();
    }
};

export { userLogin, refreshToken, logout };