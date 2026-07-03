import express from "express";
import {
    getAllProducts,
    getFeaturedProducts,
    createProduct,
    deleteProduct,
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedStatus,
    // getProductById,
    updateProduct
} from "../controllers/product.controller.js";
import { isAdmin, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, isAdmin, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/recommendedProducts", getRecommendedProducts);
router.post("/", protectRoute, isAdmin, createProduct);
router.get("/category/:category", getProductsByCategory);
router.patch("/:id", protectRoute, isAdmin, toggleFeaturedStatus);
// router.get("/:id", getProductById);
router.get("/:id", protectRoute, isAdmin, updateProduct);
router.delete("/:id", protectRoute, isAdmin, deleteProduct);

export default router;