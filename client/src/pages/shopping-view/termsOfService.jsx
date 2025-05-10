import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Link to="/shop/home" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Home</span>
        </Link>
      </div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6"></div>
          <p className="text-gray-600 mb-8">Last Updated: May 9, 2025</p>
        </motion.div>

        <motion.div variants={itemVariants} className="prose prose-indigo max-w-none">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 mb-8">
            <p className="text-gray-800 font-medium">
              Please read these Terms of Service carefully before using our website. By accessing or using our services, you agree to be bound by these terms.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
          <p>
            Welcome to 704 Fashion. These Terms of Service govern your use of our website located at www.704fashion.com (together or individually "Service") operated by 704 Labs.
          </p>
          <p>
            Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard and disclose information that results from your use of our web pages.
            Your agreement with us includes these Terms and our Privacy Policy ("Agreements"). You acknowledge that you have read and understood Agreements, and agree to be bound by them.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">2. Communications</h2>
          <p>
            By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or by emailing at support@704labs.com.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">3. Purchases</h2>
          <p>
            If you wish to purchase any product or service made available through Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including but not limited to, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
          </p>
          <p>
            You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete.
          </p>
          <p>
            We reserve the right to refuse or cancel your order at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order or other reasons.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">4. Returns and Refunds</h2>
          <p>
            We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.
          </p>
          <p>
            To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You'll also need the receipt or proof of purchase.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">5. Product Availability</h2>
          <p>
            The availability of our products may vary. We reserve the right to discontinue any products at any time. Any offer for any product or service made on this site is void where prohibited.
          </p>
          <p>
            We do not warrant that the quality of any products, services, information, or other material purchased or obtained by you will meet your expectations, or that any errors in the Service will be corrected.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">6. User Accounts</h2>
          <p>
            When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on Service.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>By email: support@704labs.com</li>
            <li>By phone: 0123-456-789</li>
            <li>By mail: 704 Fashion Street, NY</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;
