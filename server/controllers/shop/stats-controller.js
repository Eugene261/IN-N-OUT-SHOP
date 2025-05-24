const User = require("../../models/User");
const Order = require("../../models/Order");
const Product = require("../../models/Products");
const Review = require("../../models/review");

// Get platform statistics
const getStats = async (req, res) => {
  try {
    // Get customer count
    const customerCount = await User.countDocuments({ role: "user" });
    
    // Get total orders delivered (completed orders)
    const ordersDelivered = await Order.countDocuments({ 
      orderStatus: "delivered" 
    });
    
    // Get customer satisfaction from reviews
    const reviews = await Review.find({});
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.reviewValue, 0) / reviews.length 
      : 0;
    const customerSatisfaction = Math.round((averageRating / 5) * 100);
    
    // Get regions served (unique cities from delivered orders)
    const regionsServed = await Order.distinct("addressInfo.city", {
      orderStatus: "delivered"
    });
    const regionCount = regionsServed.length || 16; // fallback to 16 if no data
    
    // Get total revenue
    const revenueData = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    // Get product count
    const productCount = await Product.countDocuments({});
    
    res.status(200).json({
      success: true,
      data: {
        customerCount,
        ordersDelivered,
        customerSatisfaction,
        regionCount,
        totalRevenue,
        productCount,
        averageRating: Number(averageRating.toFixed(1))
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message
    });
  }
};

module.exports = { getStats }; 