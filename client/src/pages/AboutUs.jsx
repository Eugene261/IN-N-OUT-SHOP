import React from 'react';

const AboutUs = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <h1 className="text-4xl font-bold text-center mb-4">About Us</h1>
      <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
        We're dedicated to providing the best shopping experience with quality products and exceptional service.
      </p>

      {/* Our Story */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Story</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-lg text-gray-700 mb-6">
              Founded in 2010, our journey began with a simple mission: to create a shopping platform that puts customers first. What started as a small online store has grown into a comprehensive e-commerce solution trusted by thousands of customers worldwide.
            </p>
            <p className="text-lg text-gray-700">
              Over the years, we've expanded our product range, improved our services, and built a community of loyal customers who share our passion for quality and convenience. Our success is built on our commitment to excellence and our dedication to meeting the evolving needs of our customers.
            </p>
          </div>
          <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 italic">Company Timeline Image</p>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <span className="text-blue-600 font-bold">👥</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Customer Focus</h3>
            <p className="text-gray-600">We put our customers at the center of everything we do, striving to exceed expectations at every touchpoint.</p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-green-50 p-4 rounded-full mb-4">
              <span className="text-green-600 font-bold">🏆</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Quality</h3>
            <p className="text-gray-600">We are committed to offering only the highest quality products that meet our rigorous standards.</p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-purple-50 p-4 rounded-full mb-4">
              <span className="text-purple-600 font-bold">📈</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Innovation</h3>
            <p className="text-gray-600">We continuously innovate to improve our platform, products, and services to better serve our customers.</p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-orange-50 p-4 rounded-full mb-4">
              <span className="text-orange-600 font-bold">🛡️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Integrity</h3>
            <p className="text-gray-600">We operate with honesty, transparency, and ethical business practices in all our interactions.</p>
          </div>
        </div>
      </div>

      {/* Our Team */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { name: 'Jane Smith', role: 'CEO & Founder' },
            { name: 'John Doe', role: 'CTO' },
            { name: 'Emily Johnson', role: 'Head of Customer Experience' },
            { name: 'Michael Brown', role: 'Product Manager' },
            { name: 'Sarah Wilson', role: 'Marketing Director' },
            { name: 'David Lee', role: 'Lead Developer' }
          ].map((member, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-gray-200 h-60 rounded-lg mb-4 flex items-center justify-center">
                <p className="text-gray-500 italic">Team Member Photo</p>
              </div>
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-gray-600">{member.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Mission */}
      <div className="bg-gray-50 p-12 rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
        <p className="text-xl text-gray-700 max-w-4xl mx-auto">
          To create a seamless shopping experience that connects people with products they love, while fostering a community built on trust, quality, and exceptional service.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
