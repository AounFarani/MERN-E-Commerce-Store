import express from "express"
import { getUserProfile, logIn, logOut, refreshAccessToken, signUp } from "../controllers/auth.controller.js";
import { isAdmin, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", logIn);
router.post("/logout", logOut);
router.post("/refresh-token", refreshAccessToken);
router.get("/userProfile", protectRoute, getUserProfile);
router.get("/isAdmin", protectRoute, isAdmin);

export default router;