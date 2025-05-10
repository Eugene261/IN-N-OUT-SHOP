import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicFeaturedCollections } from '../../store/shop/featured-collection-slice';
import featured from '../../assets/featured.webp'; // Fallback image

const FeaturedCollection = () => {
  const dispatch = useDispatch();
  const { collections, isLoading, error } = useSelector((state) => state.shopFeaturedCollections);

  useEffect(() => {
    dispatch(fetchPublicFeaturedCollections());
  }, [dispatch]);

  if (isLoading) {
    return (
      <section className='py-12 px-4 lg:px-6'>
        <div className="container mx-auto flex justify-center items-center h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </section>
    );
  }

  if (error) {
    // Fallback to default content if there's an error
    console.error('Error loading featured collections:', error);
  }
  
  // Use the first active collection or fallback to default content
  const activeCollection = collections && collections.length > 0 
    ? collections.find(collection => collection.active) 
    : null;

  return (
    <section className='py-12 px-4 lg:px-6'>
      <div className="container mx-auto flex flex-col-reverse lg:flex-row items-center bg-green-50/80
        rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300
        relative isolate">
        
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.green.100),rgba(255,255,255,0.7)] opacity-40" />
        
        {/* Left content */}
        <motion.div 
          className="lg:w-1/2 p-8 lg:p-12 xl:p-16 text-center lg:text-left"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-lg font-semibold text-gray-700 mb-2"
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {activeCollection ? activeCollection.subtitle || 'Comfort and Style' : 'Comfort and Style'}
          </motion.h2>
          
          <motion.h2
            className='text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {activeCollection ? (
              <span dangerouslySetInnerHTML={{ __html: activeCollection.title || 'Apparel made for <span class="text-green-600">everyday</span> life' }} />
            ) : (
              <span>Apparel made for <span className="text-green-600">everyday</span> life</span>
            )}
          </motion.h2>
          
          <motion.p
            className="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {activeCollection ? activeCollection.description : 
              'Discover high-quality, comfortable clothing that effortlessly blends fashion and function. Designed to make you look and feel great everyday.'}
          </motion.p>
          
          <motion.div
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Link 
              to={activeCollection && activeCollection.link ? activeCollection.link : '/shop/listing'} 
              className='inline-block bg-black text-white px-8 py-4 rounded-xl
              text-lg font-medium hover:bg-gray-800 transition-all duration-300
              shadow-md hover:shadow-lg'
            >
              Shop Now
            </Link>
          </motion.div>
        </motion.div>

        {/* Right content */}
        <motion.div 
          className="lg:w-1/2 relative"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-50/50 before:to-transparent lg:before:hidden">
            <motion.img 
              src={activeCollection && activeCollection.imageUrl ? activeCollection.imageUrl : featured} 
              alt={activeCollection ? activeCollection.title || 'Featured collection' : 'Featured collection'}
              className='w-full h-[400px] lg:h-[500px] object-cover object-center
              rounded-3xl lg:rounded-none'
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedCollection;