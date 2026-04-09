import express from "express";

import { protectRoute, isAdmin } from "../middleware/auth.middleware.js";
import { getAnalyticsData, getDailySalesData } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", protectRoute, isAdmin, async (req, res) => {
    try {
        const analyticsData = await getAnalyticsData();

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const dailySalesData = await getDailySalesData(startDate, endDate);
        res.status(200).json({
            analyticsData,
            dailySalesData
        });
    } catch (error) {
        console.error("Error in Analytics Route", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

export default router;