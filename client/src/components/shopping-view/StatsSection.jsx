import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, ShoppingCart, Award, Globe } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStats } from '../../store/shop/stats-slice/index';
import { useNavigate } from 'react-router-dom';

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { statsData, isLoading, error } = useSelector(state => state.stats);

  // Fetch real data on component mount
  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  // Generate stats array from real data
  const stats = statsData ? [
    {
      icon: Users,
      number: statsData.customerCount || 0,
      suffix: '+',
      label: 'Happy Customers',
      description: 'Satisfied customers worldwide',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: ShoppingCart,
      number: statsData.ordersDelivered || 0,
      suffix: '+',
      label: 'Orders Delivered',
      description: 'Successfully completed orders',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Award,
      number: statsData.customerSatisfaction || 0,
      suffix: '%',
      label: 'Customer Satisfaction',
      description: 'Based on customer reviews',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      number: statsData.regionCount || 0,
      suffix: '+',
      label: 'Regions Served',
      description: 'Across Ghana and beyond',
      gradient: 'from-orange-500 to-red-500'
    }
  ] : [
    // Fallback data while loading
    {
      icon: Users,
      number: 25000,
      suffix: '+',
      label: 'Happy Customers',
      description: 'Satisfied customers worldwide',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: ShoppingCart,
      number: 150000,
      suffix: '+',
      label: 'Orders Delivered',
      description: 'Successfully completed orders',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Award,
      number: 98,
      suffix: '%',
      label: 'Customer Satisfaction',
      description: 'Based on customer reviews',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      number: 16,
      suffix: '+',
      label: 'Regions Served',
      description: 'Across Ghana and beyond',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const AnimatedCounter = ({ number, suffix, isVisible }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (isVisible && !isLoading) {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = number / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= number) {
            setCount(number);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(timer);
      }
    }, [isVisible, number, isLoading]);

    return (
      <span>
        {count.toLocaleString()}{suffix}
      </span>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const handleStartShopping = () => {
    navigate('/shop/listing');
  };

  if (error) {
    console.error('Stats loading error:', error);
    // Still show the section with fallback data if there's an error
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/10"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="stats-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#stats-grid)" />
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
            Our Achievements
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
            Numbers That Speak
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-black to-gray-400 rounded-full mx-auto"></div>
          <p className="text-gray-600 text-lg mt-6 max-w-2xl mx-auto">
            These numbers represent our commitment to excellence and the trust our customers place in us every day.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="group relative"
            >
              <div className="relative p-8 rounded-2xl bg-white/90 backdrop-blur-md shadow-xl hover:shadow-2xl border border-gray-100 transition-all duration-300 overflow-hidden">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                {/* Floating icon background */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full opacity-30"></div>
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${stat.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Number */}
                  <div className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                    {isLoading ? (
                      <div className="animate-pulse bg-gray-300 h-12 w-20 rounded"></div>
                    ) : (
                      <AnimatedCounter 
                        number={stat.number} 
                        suffix={stat.suffix} 
                        isVisible={isInView} 
                      />
                    )}
                  </div>
                  
                  {/* Label */}
                  <h3 className="text-xl font-semibold text-gray-700 mb-2 group-hover:text-gray-800 transition-colors">
                    {stat.label}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600 transition-colors">
                    {stat.description}
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute bottom-4 right-4 w-2 h-2 bg-gray-200 rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <div className="absolute top-6 right-6 w-1 h-1 bg-gray-300 rounded-full opacity-30 group-hover:opacity-60 transition-opacity"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 text-lg mb-6">
            Ready to become part of our growing community?
          </p>
          <motion.button
            onClick={handleStartShopping}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
          >
            Start Shopping Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection; 