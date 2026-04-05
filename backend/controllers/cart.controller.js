import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: req.user.cartItems } });

        // Add quantity of each product in the cart
        const cartItems = products.map((product) => {
            const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id);
            return { ...product.toJSON(), quantity: item.quantity };
        });

        res.status(200).json(cartItems);
    } catch (error) {
        console.log("Error in getCartProducts Controller", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        const existingCartItem = user.cartItems.find((item) => item.id === productId);
        if (existingCartItem) {
            existingCartItem.quantity += 1;
        } else {
            user.cartItems.push(productId);
        }

        await user.save();
        res.status(200).json(user.cartItems);
    } catch (error) {
        console.log("Error in addToCart Controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (!productId) {
            user.cartItems = [];
        } else {
            user.cartItems = user.cartItems.filter((item) => item.id !== productId);
        }

        await user.save();
        res.status(200).json(user.cartItems);
    } catch (error) {
        console.log("Error in removeAllFromCart Controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;
        const existingCartItem = user.cartItems.find((item) => item.id === productId);

        if (existingCartItem) {
            if (quantity === 0) {
                user.cartItems = user.cartItems.filter((item) => item.id !== productId);
                await user.save();
                res.status(200).json(user.cartItems);
            }

            existingCartItem.quantity = quantity;
            await user.save();
            res.status(200).json(user.cartItems);
        } else {
            res.status(404).json({ message: "Product not found in cart" });
        }
    } catch (error) {
        console.log("Error in updateQuantity Controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}