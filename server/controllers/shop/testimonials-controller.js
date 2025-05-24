const Review = require("../../models/review");
const User = require("../../models/User");
const Product = require("../../models/Products");

// Get customer testimonials from real reviews
const getTestimonials = async (req, res) => {
  try {
    // Get high-rating reviews (4+ stars) with user information
    const testimonials = await Review.find({ 
      reviewValue: { $gte: 4 } 
    })
    .populate('userId', 'userName')
    .populate('productId', 'title')
    .sort({ createdAt: -1 })
    .limit(10);

    if (!testimonials || testimonials.length === 0) {
      // Fallback testimonials if no reviews exist
      return res.status(200).json({
        success: true,
        data: [
          {
            id: 1,
            name: "Sarah Johnson",
            role: "Verified Customer",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b743?w=150&h=150&fit=crop&crop=face",
            rating: 5,
            text: "Amazing quality products and super fast delivery! I've been shopping here for months and never been disappointed. The customer service is exceptional.",
            location: "Accra, Ghana",
            productTitle: "Premium Collection",
            createdAt: new Date()
          },
          {
            id: 2,
            name: "Michael Chen",
            role: "Verified Customer", 
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            rating: 5,
            text: "The variety of brands and the quality of products exceeded my expectations. Great prices and excellent customer support made this my go-to store.",
            location: "Kumasi, Ghana",
            productTitle: "Fashion Collection",
            createdAt: new Date()
          }
        ]
      });
    }

    // Transform review data to testimonial format
    const formattedTestimonials = testimonials.map((review, index) => ({
      id: review._id,
      name: review.userId?.userName || `Customer ${index + 1}`,
      role: "Verified Customer",
      avatar: `https://images.unsplash.com/photo-${1494790108755 + index}?w=150&h=150&fit=crop&crop=face`,
      rating: review.reviewValue,
      text: review.reviewMessage,
      location: "Ghana", // Could be enhanced with user location data
      productTitle: review.productId?.title || "Product",
      createdAt: review.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedTestimonials
    });

  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching testimonials",
      error: error.message
    });
  }
};

// Get testimonial statistics
const getTestimonialStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    
    const averageRatingData = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$reviewValue" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = averageRatingData.length > 0 
      ? Number(averageRatingData[0].averageRating.toFixed(1))
      : 0;

    // Get satisfaction percentage (4+ star reviews)
    const highRatingReviews = await Review.countDocuments({ reviewValue: { $gte: 4 } });
    const satisfactionPercentage = totalReviews > 0 
      ? Math.round((highRatingReviews / totalReviews) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageRating,
        satisfactionPercentage
      }
    });

  } catch (error) {
    console.error("Error fetching testimonial stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching testimonial statistics",
      error: error.message
    });
  }
};

module.exports = { 
  getTestimonials,
  getTestimonialStats 
}; 