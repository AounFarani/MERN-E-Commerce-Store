import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - No  Access Token Provided" });
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId).select("-password");
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized - Access Token Expired" });
            }

            throw error;
        }
    } catch (error) {
        console.log("Error in protectRoute middleware", error.message);
        res.status(500).json({ message: error.message });
    }
}

export const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role === "admin") {
            res.status(200).json({ message: "Access Granted - Admin User" });
            next();
        } else {
            res.status(403).json({ message: "Access Denied - Admins Only" });
        }
    } catch (error) {
        console.log("Error in isAdmin middleware", error.message);
        res.status(500).json({ message: error.message });
    }
}