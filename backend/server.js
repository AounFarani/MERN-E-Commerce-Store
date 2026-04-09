import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";

import connectToDB from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js"
import productRoutes from "./routes/product.routes.js"
import cartRoutes from "./routes/cart.routes.js"
import couponRoutes from "./routes/coupon.routes.js"
import paymentRoutes from "./routes/payment.routes.js"

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json()); // Middleware to parse JSON bodies from incoming requests
app.use(cookieParser()); // Middleware to parse cookies from incoming requests, making them available in req.cookies

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(PORT, () => {
    console.log("Server is running on http://localhost:" + PORT);
    connectToDB();
});