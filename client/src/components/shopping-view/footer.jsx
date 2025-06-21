import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Facebook, Twitter, Instagram, Phone, Mail, MapPin, ArrowRight, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Footer = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 30]);
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
    <div className="border-b border-gray-700/30 lg:border-b-0">
      {/* Mobile Accordion Header */}
      <button
        className="flex justify-between items-center w-full py-5 text-left lg:hidden"
        onClick={() => toggleAccordion(sectionKey)}
      >
        <h3 className="text-lg font-semibold text-white tracking-wide">
          {title}
        </h3>
        {activeAccordion === sectionKey ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-6 w-1.5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-white tracking-wide uppercase letter-spacing-wider">
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
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-300 pt-24 pb-8 relative overflow-hidden"
      style={{ y }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-br from-blue-600/10 to-purple-600/5 blur-3xl"></div>
        <div className="absolute top-1/4 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-purple-600/8 to-pink-600/5 blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-600/10 to-blue-600/5 blur-3xl"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-16 mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
            hidden: {}
          }}
        >
          {/* Newsletter section */}
          <FooterSection title="Stay Connected" sectionKey="newsletter">
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Be the first to hear about new products, exclusive events, and online offers.
            </p>
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-2xl border border-blue-800/20 mb-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                  <Heart className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="font-medium text-sm text-white">
                  Special Offer
                </p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Sign up and get 10% off your first order.
              </p>
            </div>
            <form className="space-y-4">
              <div className="relative group">
                <input 
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                  focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm
                  group-hover:border-gray-600/50"
                  required
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-purple-600 
                  text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 
                  transition-all duration-300 shadow-lg hover:shadow-blue-500/25 
                  transform hover:scale-105 active:scale-95"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </FooterSection>

          {/* Shop links */}
          <FooterSection title="Shop" sectionKey="shop">
            <div className="space-y-1">
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
                  whileHover={{ x: 8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
                    className="text-gray-400 hover:text-white transition-all duration-300 
                    flex items-center gap-3 text-sm py-3 px-2 hover:bg-gray-800/30 
                    rounded-xl group w-full text-left backdrop-blur-sm border-l-2 border-transparent
                    hover:border-blue-500/50"
                  >
                    <div className="h-1.5 w-1.5 bg-gray-600 rounded-full group-hover:bg-blue-400 
                    transition-colors duration-300 group-hover:shadow-sm group-hover:shadow-blue-400/50"></div>
                    <span className="group-hover:font-medium transition-all duration-300">{item.name}</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </FooterSection>

          {/* Support Links */}
          <FooterSection title="Support" sectionKey="support">
            <div className="space-y-1">
              {[
                { name: 'Contact Us', path: '/shop/contact-us' },
                { name: 'About Us', path: '/shop/about-us' },
                { name: 'FAQs', path: '/shop/faqs' },
                { name: 'Features', path: '/shop/features' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Link 
                    to={item.path} 
                    className="text-gray-400 hover:text-white transition-all duration-300 
                    flex items-center gap-3 text-sm py-3 px-2 hover:bg-gray-800/30 
                    rounded-xl group backdrop-blur-sm border-l-2 border-transparent
                    hover:border-purple-500/50"
                  >
                    <div className="h-1.5 w-1.5 bg-gray-600 rounded-full group-hover:bg-purple-400 
                    transition-colors duration-300 group-hover:shadow-sm group-hover:shadow-purple-400/50"></div>
                    <span className="group-hover:font-medium transition-all duration-300">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </FooterSection>

          {/* Social & Contact */}
          <FooterSection title="Connect" sectionKey="connect">
            <div className="flex gap-3 mb-8">
              {[
                { icon: Facebook, color: "from-blue-600 to-blue-700", hoverColor: "hover:shadow-blue-500/25" },
                { icon: Twitter, color: "from-sky-500 to-sky-600", hoverColor: "hover:shadow-sky-500/25" },
                { icon: Instagram, color: "from-pink-500 to-purple-600", hoverColor: "hover:shadow-pink-500/25" }
              ].map((item, i) => (
                <motion.a
                  key={i}
                  href="#"
                  className={`p-3 rounded-2xl bg-gradient-to-r ${item.color} text-white 
                  transition-all duration-300 ${item.hoverColor} hover:shadow-lg
                  backdrop-blur-sm border border-white/10`}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
            
            <div className="space-y-4">
              {[
                { icon: Phone, text: '05-9786-***', gradient: 'from-emerald-500 to-teal-600' },
                { icon: Mail, text: 'support@innout.com', gradient: 'from-blue-500 to-indigo-600' },
                { icon: MapPin, text: 'Ghana, Accra', gradient: 'from-orange-500 to-red-500' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="group"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/30 
                  border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300
                  backdrop-blur-sm hover:bg-gray-800/50">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-r ${item.gradient} shadow-lg`}>
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white 
                    transition-colors duration-300">{item.text}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </FooterSection>
        </motion.div>

        {/* Enhanced Divider */}
        <motion.div 
          className="relative my-12"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: "circOut" }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"></div>
        </motion.div>

        {/* Enhanced Copyright */}
        <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 
              flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-sm tracking-wider">I-O</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 
              rounded-2xl blur opacity-20 animate-pulse"></div>
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-lg tracking-wide">IN-N-OUT</p>
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} All rights reserved</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex flex-wrap gap-2 justify-center lg:justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {[
              { name: 'Privacy Policy', path: '/shop/privacy-policy' },
              { name: 'Terms of Service', path: '/shop/terms-of-service' },
              { name: 'Cookie Policy', path: '/shop/cookie-policy' }
            ].map((item, i) => (
              <Link 
                key={i}
                to={item.path} 
                className="text-gray-400 hover:text-white transition-all duration-300 
                px-4 py-2.5 rounded-xl hover:bg-gray-800/40 text-sm font-medium
                border border-transparent hover:border-gray-700/50 backdrop-blur-sm"
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;