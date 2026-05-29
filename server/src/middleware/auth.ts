import passwordResetToken from "#/models/passwordResetToken";
import User from "#/models/User";
import { JWT_SECRET } from "#/utils/variables";
import { RequestHandler } from "express";
import { JwtPayload, verify } from "jsonwebtoken";

export const isValidPasswordResetToken: RequestHandler = async (req, res, next) => {
    const { token, userId } = req.body;
    const resetToken = await passwordResetToken.findOne({ owner: userId });
    if (!resetToken) return res.status(403).json({ error: "Unauthorized access, invalid token!" });
    const matched = await resetToken.compareToken(token);
    if (!matched) return res.status(403).json({ error: "Unauthorized access, invalid token!" });
    next();
}

export const mustAuth: RequestHandler = async (req, res, next) => {
    const { authorization } = req.headers;
    const token = authorization?.startsWith("Bearer ")
        ? authorization.split("Bearer ")[1]?.trim()
        : authorization?.trim();
    if (!token) return res.status(403).json({ error: "Unauthorized request!" });

    const payload = verify(token, JWT_SECRET) as JwtPayload;
    const id = payload.userId;

    const user = await User.findOne({ _id: id, token: token });
    if (!user) return res.status(403).json({ error: "Unauthorized request!" });
    req.user = {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        verified: user.verified,
        role: user.role,
        avatar: user.avatar?.url,
        is_online: user.is_online,
        last_seen: user.last_seen,
    };
    req.token = token;
    next();
}

export const isAuth: RequestHandler = async (req, res, next) => {
    const { authorization } = req.headers;
    const token = authorization?.startsWith("Bearer ")
        ? authorization.split("Bearer ")[1]?.trim()
        : authorization?.trim();
    if (token) {
        const payload = verify(token, JWT_SECRET) as JwtPayload;
        const id = payload.userId;

        const user = await User.findOne({ _id: id, token: token });
        if (!user) return res.status(403).json({ error: "Unauthorized request!" });
        req.user = {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            verified: user.verified,
            role: user.role,
            avatar: user.avatar?.url,
            is_online: user.is_online,
            last_seen: user.last_seen,
        };
        req.token = token;
    }
    next();
}

export const isVerified: RequestHandler = (req, res, next) => {
    if (!req.user.verified) {
        return res.status(403).json({ error: "Please verify your email account!" });
    }
    next();
}

export const isAdmin: RequestHandler = (req, res, next) => {
    next();
}

