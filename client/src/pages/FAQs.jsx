import React, { useState } from 'react';

const FAQs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeQuestions, setActiveQuestions] = useState([]);

  // FAQ categories and questions
  const faqCategories = [
    {
      id: 'orders',
      name: 'Orders & Shipping',
      questions: [
        {
          id: 'order-status',
          question: 'How can I track my order?',
          answer: 'You can track your order by logging into your account and visiting the "My Orders" section. There, you\'ll find tracking information for all your recent purchases.'
        },
        {
          id: 'shipping-time',
          question: 'How long does shipping take?',
          answer: 'Standard shipping typically takes 3-5 business days within the continental US. International shipping can take 7-14 business days depending on the destination country.'
        },
        {
          id: 'shipping-cost',
          question: 'How much does shipping cost?',
          answer: 'We offer free standard shipping on all orders over $50. For orders under $50, shipping costs $5.99. Express shipping options are available at checkout for an additional fee.'
        }
      ]
    },
    {
      id: 'returns',
      name: 'Returns & Exchanges',
      questions: [
        {
          id: 'return-policy',
          question: 'What is your return policy?',
          answer: 'We accept returns within 30 days of purchase for items in their original condition with tags attached. Returns are free for store credit, or you can receive a refund to your original payment method.'
        },
        {
          id: 'exchange-process',
          question: 'How do I exchange an item for a different size?',
          answer: 'To exchange an item, start a return process through your account and select "Exchange" as the reason. You can then choose the new size you want. We\'ll ship the new size once we receive your return.'
        },
        {
          id: 'return-status',
          question: 'How can I check the status of my return?',
          answer: 'You can check the status of your return by logging into your account and visiting the "My Returns" section. There, you\'ll see the current status of all your returns and refunds.'
        }
      ]
    },
    {
      id: 'products',
      name: 'Products & Sizing',
      questions: [
        {
          id: 'size-guide',
          question: 'Where can I find your size guide?',
          answer: 'Our size guide is available on each product page under the "Size & Fit" tab. We provide detailed measurements for all our products to help you find the perfect fit.'
        },
        {
          id: 'materials',
          question: 'What materials do you use in your products?',
          answer: 'We use a variety of high-quality, sustainable materials including organic cotton, recycled polyester, and ethically sourced wool. You can find specific material information on each product page.'
        },
        {
          id: 'care-instructions',
          question: 'How should I care for my purchases?',
          answer: 'Care instructions are provided on the product page and on the care label of each item. Generally, we recommend washing in cold water and air drying to extend the life of your garments and reduce environmental impact.'
        }
      ]
    },
    {
      id: 'account',
      name: 'Account & Payment',
      questions: [
        {
          id: 'create-account',
          question: 'How do I create an account?',
          answer: 'You can create an account by clicking the "Sign Up" button in the top right corner of our website. You\'ll need to provide your email address and create a password. You can also sign up during the checkout process.'
        },
        {
          id: 'payment-methods',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, and Google Pay. We also offer Shop Pay for installment payments on eligible orders.'
        },
        {
          id: 'forgot-password',
          question: 'I forgot my password. How can I reset it?',
          answer: 'Click on the "Sign In" button and then select "Forgot Password." Enter your email address, and we\'ll send you a link to reset your password. The link is valid for 24 hours.'
        }
      ]
    }
  ];

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter questions based on search term and active category
  const filteredQuestions = faqCategories.flatMap(category => {
    // If a category is selected and it's not this one, return empty array
    if (activeCategory !== 'all' && activeCategory !== category.id) {
      return [];
    }
    
    // Filter questions by search term
    return category.questions.filter(q => {
      const matchesSearch = searchTerm === '' || 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.answer.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    }).map(q => ({
      ...q,
      category: category.name,
      categoryId: category.id
    }));
  });

  // Toggle question accordion
  const toggleQuestion = (questionId) => {
    setActiveQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId) 
        : [...prev, questionId]
    );
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Find answers to common questions about our products, orders, shipping, returns, and more.
        </p>
      </div>
      
      {/* Search Bar */}
      <div className="mb-10">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search for questions..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="mb-10">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className={`px-4 py-2 rounded-full ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveCategory('all')}
          >
            All Questions
          </button>
          {faqCategories.map(category => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full ${activeCategory === category.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* FAQ Accordions */}
      <div className="space-y-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map(question => (
            <div 
              key={question.id} 
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                className="flex justify-between items-center w-full px-6 py-4 text-left bg-white hover:bg-gray-50"
                onClick={() => toggleQuestion(question.id)}
              >
                <div>
                  <span className="text-sm font-medium text-blue-600">{question.category}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">{question.question}</h3>
                </div>
                <span className="text-gray-500">
                  {activeQuestions.includes(question.id) ? '▲' : '▼'}
                </span>
              </button>
              
              {activeQuestions.includes(question.id) && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{question.answer}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <span className="text-gray-400 text-5xl block mx-auto mb-4">❓</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600">Try adjusting your search or category selection</p>
          </div>
        )}
      </div>
      
      {/* Contact Us CTA */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
        <p className="text-lg text-gray-600 mb-6">
          If you couldn't find the answer you were looking for, please contact our support team.
        </p>
        <a 
          href="/shop/contact-us" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
};

export default FAQs;
