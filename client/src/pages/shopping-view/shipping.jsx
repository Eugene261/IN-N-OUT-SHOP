import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, Clock, Globe, Info, ShieldCheck, ArrowLeft, MapPin, DollarSign, HelpCircle, AlertTriangle } from 'lucide-react';

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

  // Shipping rate data
  const domesticShippingRates = [
    { region: 'Accra (Central)', cost: 10, time: '1-2 business days' },
    { region: 'Accra (Suburbs)', cost: 15, time: '2-3 business days' },
    { region: 'Kumasi', cost: 20, time: '2-4 business days' },
    { region: 'Takoradi', cost: 25, time: '3-5 business days' },
    { region: 'Tamale', cost: 30, time: '4-6 business days' },
    { region: 'Other Regions', cost: 35, time: '5-7 business days' },
  ];

  const internationalShippingRates = [
    { region: 'West Africa', cost: 50, time: '7-10 business days' },
    { region: 'Rest of Africa', cost: 70, time: '10-14 business days' },
    { region: 'Europe', cost: 100, time: '10-15 business days' },
    { region: 'North America', cost: 120, time: '12-18 business days' },
    { region: 'Asia', cost: 110, time: '14-20 business days' },
    { region: 'Australia & Oceania', cost: 130, time: '15-21 business days' },
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
            We offer reliable shipping options to ensure your purchases reach you safely and on time. 
            Below you'll find detailed information about our shipping rates, policies, and delivery times.
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Free Shipping Card */}
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            variants={itemVariants}
          >
            <div className="bg-blue-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Truck className="text-blue-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Free Shipping</h2>
            <p className="text-gray-600">
              Enjoy free standard shipping on all orders over GHS 100 within Accra. 
              For orders under GHS 100, standard shipping rates apply.
            </p>
          </motion.div>

          {/* Delivery Times Card */}
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            variants={itemVariants}
          >
            <div className="bg-green-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Clock className="text-green-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Delivery Times</h2>
            <p className="text-gray-600">
              Delivery times vary based on your location. Within Accra, expect delivery within 1-2 business days. 
              Other regions in Ghana may take 2-7 business days.
            </p>
          </motion.div>

          {/* International Shipping Card */}
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            variants={itemVariants}
          >
            <div className="bg-purple-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Globe className="text-purple-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">International Shipping</h2>
            <p className="text-gray-600">
              We ship to select countries worldwide. International shipping rates start at GHS 50, 
              with delivery times ranging from 7-21 business days depending on location.
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
                Domestic Shipping (Ghana)
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

            {/* International Shipping */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-1 text-gray-700" />
                International Shipping
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
                    {internationalShippingRates.map((rate, index) => (
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
                  Orders are typically processed within 24-48 hours after payment confirmation. 
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
                  Occasional delays may occur due to weather conditions, customs clearance for international orders, 
                  or other unforeseen circumstances. We will notify you of any significant delays affecting your order.
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
                <h3 className="text-lg font-semibold mb-2">Do you ship to P.O. boxes?</h3>
                <p className="text-gray-600">
                  Yes, we ship to P.O. boxes for domestic orders within Ghana. However, for international orders, 
                  we require a physical address for delivery.
                </p>
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
                  Yes, we offer expedited shipping options for an additional fee. These options will be available 
                  during checkout if they are available for your location.
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
          <h2 className="text-xl font-bold mb-3">Need More Help?</h2>
          <p className="text-gray-600 mb-4">
            If you have any questions about shipping or delivery, our customer service team is here to help.
          </p>
          <a 
            href="/contact" 
            className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPage;
