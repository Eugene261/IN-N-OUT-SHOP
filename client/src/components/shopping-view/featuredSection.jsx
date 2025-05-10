import React from 'react'
import { HiShoppingBag, HiOutlineCreditCard } from 'react-icons/hi';
import { HiArrowPathRoundedSquare } from "react-icons/hi2";
import { motion } from 'framer-motion';

const FeaturedSection = () => {
  const features = [
    {
      icon: <HiShoppingBag />,
      title: "NATIONWIDE SHIPPING",
      text: "On all orders over GHS100.00"
    },
    {
      icon: <HiArrowPathRoundedSquare />,
      title: "45 DAYS RETURN POLICY",
      text: "Money back guarantee"
    },
    {
      icon: <HiOutlineCreditCard />,
      title: "SECURE CHECKOUT",
      text: "100% secured checkout process"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 200 }
    }
  };

  const iconVariants = {
    hover: { 
      scale: 1.1,
      rotate: -10,
      transition: { type: 'spring', stiffness: 300 }
    },
    tap: { scale: 0.95 }
  };

  return (
    <motion.section 
      className="py-16 px-4 bg-gradient-to-b from-white to-green-50/30"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="container mx-auto">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="flex flex-col items-center p-6 lg:p-8 bg-white rounded-2xl 
              shadow-sm hover:shadow-md transition-all duration-300 group"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="p-4 mb-4 rounded-full bg-green-100 text-green-600
                group-hover:bg-green-600 group-hover:text-white transition-colors"
                variants={iconVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <div className="text-3xl">
                  {feature.icon}
                </div>
              </motion.div>

              <h4 className="text-lg font-semibold mb-3 tracking-normal text-gray-800">
                {feature.title}
              </h4>
              
              <p className='text-gray-600 text-sm max-w-xs leading-relaxed'>
                {feature.text}
              </p>

              {/* Decorative line */}
              <div className="w-16 h-0.5 bg-green-200 mt-6 group-hover:bg-green-600 
              transition-colors" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}

export default FeaturedSection;