import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Facebook, Twitter, Instagram, Phone, Mail, MapPin, ArrowRight, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Footer = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const navigate = useNavigate();
  
  // State for accordion sections on mobile
  const [activeAccordion, setActiveAccordion] = useState(null);

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const staggerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6 }
    })
  };

  const FooterSection = ({ title, children, sectionKey }) => (
    <div className="border-b border-gray-200 lg:border-b-0">
      {/* Mobile Accordion Header */}
      <button
        className="flex justify-between items-center w-full py-4 text-left lg:hidden"
        onClick={() => toggleAccordion(sectionKey)}
      >
        <h3 className="text-xl font-bold text-gray-900">
          {title}
        </h3>
        {activeAccordion === sectionKey ? (
          <ChevronUp className="h-6 w-6 text-gray-600" />
        ) : (
          <ChevronDown className="h-6 w-6 text-gray-600" />
        )}
      </button>
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-900">
            {title}
          </h3>
        </div>
      </div>
      
      {/* Content */}
      <div className={`lg:block ${activeAccordion === sectionKey ? 'block' : 'hidden'} pb-6 lg:pb-0`}>
        {children}
      </div>
    </div>
  );

  return (
    <motion.footer 
      className="bg-gradient-to-b from-white to-gray-50 text-gray-800 pt-20 pb-12 border-t border-gray-100 relative overflow-hidden"
      style={{ y }}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-200/30 to-indigo-300/20 blur-xl"></div>
        <div className="absolute top-1/4 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-blue-200/20 to-purple-200/20 blur-xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-amber-200/30 to-amber-100/20 blur-xl"></div>
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {}
          }}
        >
          {/* Newsletter section */}
          <FooterSection title="Stay Connected" sectionKey="newsletter">
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Be the first to hear about new products, exclusive events, and online offers.
            </p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-100 mb-6 flex items-center gap-2">
              <Heart className="h-4 w-4 text-indigo-500" />
              <p className="font-medium text-sm text-gray-800">
                Sign up and get 10% off your first order.
              </p>
            </div>
            <form className="flex flex-col gap-3">
              <div className="relative">
                <input 
                  type="email"
                  placeholder="Enter your email"
                  className="p-3.5 pl-4 w-full text-sm bg-white border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder-gray-400
                  shadow-sm"
                  required
                />
                <button 
                  type="submit" 
                  className="absolute right-1.5 top-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2
                  rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md
                  whitespace-nowrap flex items-center justify-center"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">We respect your privacy. Unsubscribe at any time.</p>
            </form>
          </FooterSection>

          {/* Shop links */}
          <FooterSection title="Shop" sectionKey="shop">
            <div className="space-y-2.5">
              {[
                { name: 'All Products', path: '/shop/listing' },
                { name: 'Men', path: '/shop/listing', category: 'men' },
                { name: 'Women', path: '/shop/listing', category: 'women' },
                { name: 'Kids', path: '/shop/listing', category: 'kids' },
                { name: 'Accessories', path: '/shop/listing', category: 'accessories' },
                { name: 'Footwear', path: '/shop/listing', category: 'footwear' },
                { name: 'Devices', path: '/shop/listing', category: 'devices' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <button 
                    onClick={() => {
                      if (item.category) {
                        sessionStorage.removeItem('filters');
                        sessionStorage.setItem('filters', JSON.stringify({
                          category: [item.category]
                        }));
                      }
                      navigate(item.path);
                    }}
                    className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2 text-sm
                    p-2 hover:bg-indigo-50/50 rounded-lg group w-full text-left"
                  >
                    <div className="h-4 w-4 text-indigo-400 group-hover:text-indigo-500 transition-colors">→</div>
                    {item.name}
                  </button>
                </motion.div>
              ))}
            </div>
          </FooterSection>

          {/* Support Links */}
          <FooterSection title="Support" sectionKey="support">
            <div className="space-y-2.5">
              {[
                { name: 'Contact Us', path: '/shop/contact-us' },
                { name: 'About Us', path: '/shop/about-us' },
                { name: 'FAQs', path: '/shop/faqs' },
                { name: 'Features', path: '/shop/features' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Link 
                    to={item.path} 
                    className="text-gray-600 hover:text-amber-600 transition-colors flex items-center gap-2 text-sm
                    p-2 hover:bg-amber-50/50 rounded-lg group"
                  >
                    <div className="h-4 w-4 text-amber-400 group-hover:text-amber-500 transition-colors">→</div>
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </FooterSection>

          {/* Social & Contact */}
          <FooterSection title="Connect" sectionKey="connect">
            <div className="flex space-x-3 mb-6">
              {[
                { icon: Facebook, color: "bg-gradient-to-br from-blue-500 to-blue-600" },
                { icon: Twitter, color: "bg-gradient-to-br from-blue-400 to-sky-500" },
                { icon: Instagram, color: "bg-gradient-to-br from-pink-500 to-purple-600" }
              ].map((item, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className={`p-2.5 rounded-full bg-gray-100 hover:text-white transition-all shadow-sm`}
                  style={{ backgroundColor: i === 0 ? '#3b82f6' : i === 1 ? '#0ea5e9' : '#ec4899' }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="h-5 w-5 text-white" />
                </motion.a>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { icon: Phone, text: '05-9786-***', color: 'bg-blue-50 border-blue-100 text-blue-600' },
                { icon: Mail, text: 'support@innout.com', color: 'bg-purple-50 border-purple-100 text-purple-600' },
                { icon: MapPin, text: 'Ghana, Accra', color: 'bg-amber-50 border-amber-100 text-amber-600' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className={`p-3.5 rounded-xl ${item.color} border flex items-center gap-3
                  hover:shadow-md transition-all`}
                  whileHover={{ y: -3, x: 2 }}
                  whileTap={{ y: 0, x: 0 }}
                >
                  <div className="bg-white p-1.5 rounded-full shadow-sm">
                    <item.icon className="" size={16} />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </FooterSection>
        </motion.div>

        {/* Divider */}
        <motion.div 
          className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent my-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: "circOut" }}
        />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-4 md:mb-0 text-center md:text-left flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              I-O
            </div>
            <span>© {new Date().getFullYear()} IN-N-OUT. All rights reserved</span>
          </motion.div>
          
          <motion.div 
            className="flex gap-2 flex-wrap justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/shop/privacy-policy" className="hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 text-gray-600">
              Privacy Policy
            </Link>
            <Link to="/shop/terms-of-service" className="hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 text-gray-600">
              Terms of Service
            </Link>
            <Link to="/shop/cookie-policy" className="hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 text-gray-600">
              Cookie Policy
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;