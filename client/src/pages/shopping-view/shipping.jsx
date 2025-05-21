import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, Clock, Globe, Info, ShieldCheck, ArrowLeft, MapPin, DollarSign, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';

const ShippingPage = () => {
  const navigate = useNavigate();

  // Animation variants
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
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  // Updated shipping rate data
  const domesticShippingRates = [
    { region: 'Accra (City)', cost: 40, time: '1-2 business days' },
    { region: 'Greater Accra Region', cost: 40, time: '1-3 business days' },
    { region: 'All Other Regions', cost: 70, time: '3-5 business days' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Page Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Shipping Information</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We deliver your purchases quickly and reliably throughout Ghana. 
            Our simple shipping rates are based on your delivery location, with special rates for Accra and the Greater Accra Region.
          </p>
        </motion.div>

        {/* Multi-Vendor Shipping Banner */}
        <motion.div
          className="mb-12 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl shadow-sm border border-blue-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white p-3 rounded-full shadow-sm mr-4">
                <Truck className="text-indigo-600 w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Multi-Vendor Shipping</h2>
                <p className="text-sm text-gray-600 mt-1">Each vendor sets their own shipping rates based on their location</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center">
                <span className="text-lg font-semibold mr-2">GHS 40</span>
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">Same Region Rate</span>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-lg font-semibold mr-2">GHS 70</span>
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">Other Regions Rate</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 italic">Rates may vary by vendor</div>
            </div>
          </div>
        </motion.div>

        {/* How Multi-Vendor Shipping Works */}
        <motion.div
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
            <Info className="w-5 h-5 mr-2 text-blue-500" />
            How Our Multi-Vendor Shipping Works
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <p>
              Our platform hosts multiple independent vendors, each with their own shipping policies based on their location.
              When you order items from different vendors, each vendor will ship their products separately.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Regional Shipping Discounts
              </h3>
              <p className="text-sm">
                When you order from a vendor located in your region, you'll automatically receive a reduced shipping rate. 
                This encourages supporting local vendors and reduces shipping costs!
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Main Content */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Delivery Times Card */}
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            variants={itemVariants}
          >
            <div className="bg-green-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Clock className="text-green-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Fast Delivery</h2>
            <p className="text-gray-600">
              Orders in Accra are typically delivered within 1-3 business days. 
              Orders to other regions of Ghana take approximately 3-5 business days to arrive.
            </p>
          </motion.div>

          {/* Tracking Card */}
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            variants={itemVariants}
          >
            <div className="bg-blue-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <ShieldCheck className="text-blue-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Order Tracking</h2>
            <p className="text-gray-600">
              After your order ships, you'll receive tracking information via email. 
              You can also view tracking details in your account dashboard.
            </p>
          </motion.div>

          {/* Secure Packaging Card */}
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            variants={itemVariants}
          >
            <div className="bg-purple-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CheckCircle className="text-purple-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Secure Packaging</h2>
            <p className="text-gray-600">
              All items are carefully packaged to ensure they arrive in perfect condition.
              We use quality materials to protect your purchase during transit.
            </p>
          </motion.div>
        </motion.div>

        {/* Shipping Rates Tables */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="text-red-500 w-5 h-5" />
              <h2 className="text-2xl font-bold">Shipping Rates</h2>
            </div>

            {/* Domestic Shipping */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-1 text-gray-700" />
                Ghana Shipping Rates
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (GHS)</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {domesticShippingRates.map((rate, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-sm text-gray-900">{rate.region}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{rate.cost}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{rate.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How Shipping Works */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">How Our Shipping Process Works</h3>
              <ol className="space-y-3 ml-4">
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold rounded-full w-6 h-6 text-sm mr-3">1</span>
                  <span className="text-gray-700">Place your order and select your shipping address at checkout</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold rounded-full w-6 h-6 text-sm mr-3">2</span>
                  <span className="text-gray-700">Shipping fee is automatically calculated based on your location</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold rounded-full w-6 h-6 text-sm mr-3">3</span>
                  <span className="text-gray-700">Your order is processed and prepared for shipping within 24 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold rounded-full w-6 h-6 text-sm mr-3">4</span>
                  <span className="text-gray-700">You receive tracking information via email</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold rounded-full w-6 h-6 text-sm mr-3">5</span>
                  <span className="text-gray-700">Your package is delivered to your address within the estimated timeframe</span>
                </li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Shipping Policies */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Info className="text-blue-500 w-5 h-5" />
              <h2 className="text-2xl font-bold">Shipping Policies</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Order Processing</h3>
                <p className="text-gray-600">
                  Orders are typically processed within 24 hours after payment confirmation. 
                  You will receive a confirmation email with tracking information once your order ships.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Tracking Your Order</h3>
                <p className="text-gray-600">
                  All orders include tracking information that will be sent to your email. 
                  You can also track your order by logging into your account and viewing your order history.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Shipping Delays</h3>
                <p className="text-gray-600">
                  Occasional delays may occur due to weather conditions or other unforeseen circumstances. 
                  We will notify you of any significant delays affecting your order.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="text-yellow-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important Note</h4>
                  <p className="text-yellow-700 text-sm">
                    Shipping times are estimates and not guaranteed. During peak seasons (holidays, special promotions), 
                    processing and delivery times may be longer than usual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="text-green-500 w-5 h-5" />
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">How are shipping costs calculated in a multi-vendor order?</h3>
                <p className="text-gray-600">
                  In our multi-vendor platform, each vendor sets their own shipping rates based on their location. 
                  The standard rates are GHS 40 for deliveries within the vendor's region, and GHS 70 for deliveries to other regions.
                  When you order from multiple vendors, each vendor's shipping fee is calculated separately and added to your total.
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                  <strong>Example:</strong> If you order from three different vendors and one is in your region while
                  two are in different regions, your shipping total might be: GHS 40 + GHS 70 + GHS 70 = GHS 180
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What if my package is lost or damaged?</h3>
                <p className="text-gray-600">
                  If your package is lost or arrives damaged, please contact our customer service team within 48 hours 
                  of the delivery date. We will work with you to resolve the issue promptly.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Can I change my shipping address after placing an order?</h3>
                <p className="text-gray-600">
                  Address changes may be possible if the order has not yet been processed. Please contact our customer 
                  service team immediately if you need to change your shipping address.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Do you offer expedited shipping?</h3>
                <p className="text-gray-600">
                  Shipping options vary by vendor. Some vendors may offer expedited shipping for an additional fee.
                  These options, if available, will be displayed during checkout for eligible items.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Why am I seeing different shipping fees for similar items?</h3>
                <p className="text-gray-600">
                  Since each vendor determines their own shipping rates based on their location, two similar items from different
                  vendors may have different shipping costs. This is especially noticeable when vendors are located in different
                  regions of Ghana.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Can I combine shipping from multiple vendors?</h3>
                <p className="text-gray-600">
                  Currently, shipping fees are calculated separately for each vendor in your order. However, when you purchase
                  multiple items from the same vendor, they will be shipped together with a single shipping fee.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div 
          className="text-center mt-12 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-3">Need Help With Your Order?</h2>
          <p className="text-gray-600 mb-4">
            If you have any questions about shipping or delivery, our customer service team is here to help.
          </p>
          <a 
            href="/contact" 
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPage;
