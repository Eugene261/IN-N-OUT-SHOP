import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Lock, Server, Bell, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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

  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      color: "bg-blue-100 text-blue-600 border-blue-200"
    },
    {
      icon: Server,
      title: "How We Use Your Information",
      color: "bg-indigo-100 text-indigo-600 border-indigo-200"
    },
    {
      icon: Shield,
      title: "Data Protection",
      color: "bg-purple-100 text-purple-600 border-purple-200"
    },
    {
      icon: Bell,
      title: "Communications",
      color: "bg-pink-100 text-pink-600 border-pink-200"
    },
    {
      icon: Lock,
      title: "Security Measures",
      color: "bg-amber-100 text-amber-600 border-amber-200"
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      color: "bg-emerald-100 text-emerald-600 border-emerald-200"
    }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-6"></div>
          <p className="text-gray-600 mb-8">Last Updated: May 9, 2025</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {sections.map((section, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl border ${section.color} flex items-center gap-3`}
            >
              <div className="bg-white p-2 rounded-full shadow-sm">
                <section.icon className="h-5 w-5" />
              </div>
              <span className="font-medium">{section.title}</span>
            </div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="prose prose-blue max-w-none">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-8">
            <p className="text-gray-800 font-medium">
              At 704 Fashion, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.
          </p>
          <p>
            The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect may include the following:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Name and contact data (email address, postal address, phone number)</li>
            <li>Credentials (password and similar security information used for authentication)</li>
            <li>Payment data (credit card details, billing address)</li>
            <li>Order history and preferences</li>
            <li>Usage data (how you interact with our website)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">2. How We Use Your Information</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. We indicate the specific processing grounds we rely on next to each purpose listed below.
          </p>
          <p>
            We use the information we collect or receive:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>To facilitate account creation and login process</li>
            <li>To process and deliver orders</li>
            <li>To send administrative information to you</li>
            <li>To send you marketing and promotional communications</li>
            <li>To respond to your inquiries and offer support</li>
            <li>To request feedback and to improve our website and your experience</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">3. Data Protection</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">4. Communications</h2>
          <p>
            We may use your personal information to contact you with newsletters, marketing or promotional materials and other information that may be of interest to you. You may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or the instructions provided in any email we send.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">5. Security Measures</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">6. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, such as:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>The right to access the personal information we have about you</li>
            <li>The right to request that we correct or update any personal information we have about you</li>
            <li>The right to request that we delete any personal information we have about you</li>
            <li>The right to opt out of marketing communications</li>
            <li>The right to withdraw consent where we rely on consent to process your personal information</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">7. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>By email: privacy@704labs.com</li>
            <li>By phone: 0123-456-789</li>
            <li>By mail: 704 Fashion Street, NY</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
