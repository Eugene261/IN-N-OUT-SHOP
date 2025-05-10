import React from 'react';

const Features = () => {
  const features = [
    {
      emoji: '🚚',
      title: 'Free Shipping',
      description: 'Enjoy free standard shipping on all orders over $50. Fast and reliable delivery to your doorstep.'
    },
    {
      emoji: '🛡️',
      title: 'Secure Shopping',
      description: 'Shop with confidence knowing that your personal information and transactions are protected.'
    },
    {
      emoji: '🔄',
      title: 'Easy Returns',
      description: 'Not satisfied? Return your purchase within 30 days for a full refund or exchange.'
    },
    {
      emoji: '💳',
      title: 'Flexible Payment',
      description: 'Choose from multiple payment options including credit cards, PayPal, and installment plans.'
    },
    {
      emoji: '🎁',
      title: 'Gift Cards',
      description: 'Perfect for any occasion, our gift cards let your loved ones choose exactly what they want.'
    },
    {
      emoji: '🤝',
      title: 'Loyalty Program',
      description: 'Earn points with every purchase and redeem them for exclusive discounts and rewards.'
    },
    {
      emoji: '🍃',
      title: 'Sustainable Practices',
      description: 'We\'re committed to reducing our environmental impact through eco-friendly packaging and practices.'
    },
    {
      emoji: '📱',
      title: 'Mobile App',
      description: 'Shop on the go with our user-friendly mobile app. Available for iOS and Android devices.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Features</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Discover the benefits and services that make shopping with us a great experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {features.slice(0, 4).map((feature, index) => (
          <div 
            key={index}
            className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center h-full"
          >
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <span className="text-3xl">{feature.emoji}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mb-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-white mb-4">Premium Customer Support</h2>
              <p className="text-white text-lg mb-6">
                Our dedicated customer service team is available 7 days a week to assist you with any questions or concerns.
              </p>
              <a 
                href="/shop/contact-us" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 transition-colors self-start"
              >
                Contact Us
              </a>
            </div>
            <div className="bg-white p-12 flex items-center justify-center">
              <div className="bg-gray-200 h-64 w-full rounded-lg flex items-center justify-center">
                <p className="text-gray-500 italic">Customer Support Image</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.slice(4).map((feature, index) => (
          <div 
            key={index + 4}
            className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center h-full"
          >
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <span className="text-3xl">{feature.emoji}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
