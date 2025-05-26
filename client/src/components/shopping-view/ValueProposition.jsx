import React from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Shield, 
  CreditCard, 
  Headphones, 
  RefreshCw, 
  Award 
} from 'lucide-react';

const ValueProposition = () => {
  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free delivery on orders over GHS 1000",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "100% secure payment processing",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: RefreshCw,
      title: "Easy Returns",
      description: "30-day hassle-free returns",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated customer support",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Award,
      title: "Quality Guaranteed",
      description: "Premium quality products only",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: CreditCard,
      title: "Flexible Payment",
      description: "Multiple payment options available",
      gradient: "from-teal-500 to-green-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Background with subtle patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-blue-50/15 to-indigo-50/10"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="value-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#value-grid)" />
          </svg>
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-bold tracking-widest uppercase text-gray-500 mb-3">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
            Premium Shopping Experience
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-black to-gray-400 rounded-full mx-auto"></div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="group"
            >
              <div className="relative p-8 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-gray-200 rounded-full opacity-50"></div>
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-gray-300 rounded-full opacity-30"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ValueProposition; 