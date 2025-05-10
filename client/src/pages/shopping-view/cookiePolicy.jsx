import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cookie, Clock, Settings, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookiePolicy = () => {
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

  const cookieTypes = [
    {
      name: "Essential Cookies",
      description: "Necessary for the website to function properly",
      canDisable: false
    },
    {
      name: "Functional Cookies",
      description: "Enable personalized features and remember your preferences",
      canDisable: true
    },
    {
      name: "Performance Cookies",
      description: "Collect information about how you use our website",
      canDisable: true
    },
    {
      name: "Marketing Cookies",
      description: "Track your activity to deliver targeted advertising",
      canDisable: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Link to="/shop/home" className="inline-flex items-center text-amber-600 hover:text-amber-800 transition-colors">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-6"></div>
          <p className="text-gray-600 mb-8">Last Updated: May 9, 2025</p>
        </motion.div>

        <motion.div variants={itemVariants} className="prose prose-amber max-w-none">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Cookie className="h-5 w-5 text-amber-600" />
              <p className="text-gray-800 font-medium">
                This Cookie Policy explains how 704 Fashion uses cookies and similar technologies to recognize you when you visit our website.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              It explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">What Are Cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
          <p>
            Cookies set by the website owner (in this case, 704 Fashion) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content and analytics).
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Why Do We Use Cookies?</h2>
          <p>
            We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our website.
          </p>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6 mb-8 shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Types of Cookies We Use</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {cookieTypes.map((cookie, index) => (
                <div key={index} className="p-4 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{cookie.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{cookie.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${cookie.canDisable ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {cookie.canDisable ? 'Optional' : 'Required'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">How Can You Control Cookies?</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager that we make available on our website.
          </p>
          <p>
            You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h4 className="font-medium text-gray-800">Cookie Lifespan</h4>
              </div>
              <p className="text-sm text-gray-600">
                The length of time a cookie will remain on your device depends on whether it is a "persistent" or "session" cookie. Session cookies will remain until you stop browsing. Persistent cookies remain until they expire or are deleted.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-amber-600" />
                <h4 className="font-medium text-gray-800">Browser Settings</h4>
              </div>
              <p className="text-sm text-gray-600">
                Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Third-Party Cookies</h2>
          <p>
            In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on.
          </p>
          
          <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100 my-6">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Please note that third parties (including, for example, advertising networks and providers of external services like web traffic analysis services) may also use cookies, over which we have no control.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Updates to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
          </p>
          <p>
            The date at the top of this Cookie Policy indicates when it was last updated.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">More Information</h2>
          <p>
            If you have any questions about our use of cookies or other technologies, please contact us at:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>By email: privacy@704labs.com</li>
            <li>By phone: 0123-456-789</li>
            <li>By mail: 704 Fashion Street, NY</li>
          </ul>
          
          <div className="flex items-center gap-2 mt-8 text-sm text-gray-600">
            <ExternalLink className="h-4 w-4" />
            <p>
              For more information about cookies in general, visit <a href="https://www.allaboutcookies.org" className="text-amber-600 hover:text-amber-800 underline" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CookiePolicy;
