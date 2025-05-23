import React from 'react';

const ContactUs = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <h1 className="text-4xl font-bold text-center mb-12">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <span className="text-blue-600 font-bold">📞</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Call Us</h3>
          <p className="text-gray-600 mb-4">Mon-Fri from 8am to 5pm</p>
          <a href="tel:+1234567890" className="text-blue-600 font-medium">+1 (234) 567-890</a>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="bg-green-50 p-4 rounded-full mb-4">
            <span className="text-green-600 font-bold">✉️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Email Us</h3>
          <form className="w-full">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="John Doe"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="john@example.com"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
                placeholder="How can we help you?"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300"
            >
              Contact Us
            </button>
          </form>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="bg-purple-50 p-4 rounded-full mb-4">
            <span className="text-purple-600 font-bold">🏢</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
          <p className="text-gray-600 mb-4">Our store locations</p>
          <address className="text-purple-600 font-medium not-italic">
            123 Commerce Street<br />
            San Francisco, CA 94103
          </address>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Customer Support Hours</h2>
        <div className="flex justify-center space-x-8">
          <div>
            <p className="text-gray-600"><span className="font-medium">Monday-Friday:</span> 9:00 AM - 6:00 PM</p>
            <p className="text-gray-600"><span className="font-medium">Saturday:</span> 10:00 AM - 4:00 PM</p>
            <p className="text-gray-600"><span className="font-medium">Sunday:</span> Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
