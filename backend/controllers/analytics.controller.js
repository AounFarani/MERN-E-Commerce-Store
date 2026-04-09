import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

export const getAnalyticsData = async () => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: null, // it groups all MongoDB documents together
                    totalSales: { $sum: 1 }, // count the number of orders
                    totalRevenue: { $sum: "$totalAmount" } // sum up the total amount
                }
            }
        ]);

        const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };

        return {
            users: totalUsers,
            products: totalProducts,
            totalSales,
            totalRevenue
        }
    } catch (error) {
        //console.error("Error in getAnalyticsData Controller", error.message);
        //res.status(500).json({ message: "Internal Server error", error: error.message });
        throw error;
    }
}

export const getDailySalesData = async (startDate, endDate) => {
    try {
        const dailySalesData = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate, // greater than or equal
                        $lte: endDate // less than or equal
                    },
                }
            }, {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // group by date
                    sales: { $sum: 1 }, // count the number of orders
                    revenue: { $sum: "$totalAmount" } // sum up the total amount
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // example of dailySalesData
        // [
        // 	{
        // 		_id: "2024-08-18",
        // 		sales: 12,
        // 		revenue: 1450.75
        // 	},
        // ]

        const dateArray = getDatesInRange(startDate, endDate);
        //console.log(dateArray); // ["2024-08-18", "2024-08-19", "2024-08-20", ...]

        return dateArray.map((date) => {
            const foundData = dailySalesData.find((item) => item._id === date);

            return {
                date,
                sales: foundData?.sales || 0,
                revenue: foundData?.revenue || 0
            };
        })
    } catch (error) {
        //console.error("Error in getDailySalesData Controller", error.message);
        //res.status(500).json({ message: "Internal Server error", error: error.message });
        throw error;
    }
}

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}