import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ products });
    } catch (error) {
        console.error("Error in getAllProducts Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");
        if (featuredProducts) {
            return res.status(200).json(JSON.parse(featuredProducts));
        }

        // If not in redis cache, fetch from MongoDB
        //.lean() is used to get plain JavaScript objects instead of Mongoose documents, which can improve
        //performance when we don't need the additional features of Mongoose documents.
        featuredProducts = await Product.find({ isFeatured: true }).lean();

        if (!featuredProducts) {
            return res.status(404).json({ message: "No featured products found" });
        }

        // Store in Redis cache for future requests
        await redis.set("featured_products", JSON.stringify(featuredProducts));
        res.status(200).json({ featuredProducts: featuredProducts });
    } catch (error) {
        console.error("Error in getFeaturedProducts Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;
        let cloudinaryResponse = null;
        if (image) {
            // Upload the image to Cloudinary
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse ? cloudinaryResponse.secure_url : null,
            category
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Error in createProduct Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0]; // Extract public ID from the image URL
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`); // Delete the image from Cloudinary
                console.log("Image deleted from Cloudinary successfully");
            } catch (error) {
                console.error("Error deleting image from Cloudinary", error.message);
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error in deleteProduct Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const recommendedProducts = await Product.aggregate([
            {
                $sample: { size: 5 }
            }, {
                $project: {
                    name: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                    category: 1
                }
            }
        ]);
        res.status(200).json({ recommendedProducts });
    } catch (error) {
        console.error("Error in getRecommendedProducts Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const products = await Product.find({ category });
        res.status(200).json({ products });
    } catch (error) {
        console.error("Error in getProductsByCategory Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ product });
    } catch (error) {
        console.error("Error in getProductById Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, image, category } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (image) {
            // If a new image is provided, delete the old one from Cloudinary
            if (product.image) {
                const publicId = product.image.split("/").pop().split(".")[0]; // Extract public ID from image URL
                try {
                    await cloudinary.uploader.destroy(`products/${publicId}`); // Delete the old image from Cloudinary
                    console.log("Old image deleted from Cloudinary successfully");
                } catch (error) {
                    console.error("Error deleting old image from Cloudinary", error.message);
                }
            }

            // Upload the new image to Cloudinary
            const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
            product.image = cloudinaryResponse.secure_url;

            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.category = category || product.category;

            const updatedProduct = await product.save();
            res.status(200).json(updatedProduct);
        }
    } catch (error) {
        console.error("Error in updateProduct Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

export const toggleFeaturedStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductsCache(); // Update the Redis cache after toggling the featured status
            res.status(200).json(updatedProduct);
        } else {
            return res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Error in toggleFeaturedStatus Controller", error.message);
        res.status(500).json({ message: "Internal Server error", error: error.message });
    }
}

async function updateFeaturedProductsCache() {
    try {
        // .lean() is used to get plain JavaScript objects instead of Mongoose documents, which can improve
        // performance when we don't need the additional features of Mongoose documents.
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.error("Error in update cache function", error.message);
    }
}