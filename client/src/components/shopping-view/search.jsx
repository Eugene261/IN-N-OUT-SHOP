import React, { useEffect, useState, useRef } from 'react'
import { Input } from '../ui/input'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getSearchResults, resetSearchResults } from '../../store/shop/search-slice'
import ShoppingProductTile from './productTile'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice'
import ProductOptionsModal from './productOptionsModal'

function SearchProducts() {
    const [keyword, setKeyword] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const { searchResults } = useSelector(state => state.shopSearch);
    const { cartItems } = useSelector(state => state.shopCart);
    const { user } = useSelector(state => state.auth);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    


    useEffect(() => {
        let searchTimer
        if(keyword.trim().length > 2) {
            searchTimer = setTimeout(() => {
                setSearchParams(new URLSearchParams(`?keyword=${keyword}`))
                dispatch(getSearchResults(keyword))
            }, 500)
        } else {
            setSearchParams(new URLSearchParams(`?keyword=${keyword}`))
            dispatch(resetSearchResults());
        }
        return () => clearTimeout(searchTimer)
    }, [keyword]);




    function handleAddToCart(getCurrentProductId, getTotalStock) {
        // Check if user is authenticated
        if (!user || !user.id) {
            toast.error("Please login to add items to your cart", {
                position: 'top-center',
                duration: 2000
            });
            return;
        }
        
        // Find the product by ID
        const product = searchResults?.find(p => p._id === getCurrentProductId);
        
        if (product) {
            // Open the options modal with the selected product
            setSelectedProduct(product);
            setIsOptionsModalOpen(true);
        } else {
            toast.error("Product not found", {
                position: 'top-center',
                duration: 2000
            });
        }
    };


    function handleGetProductDetails(getCurrentProductId){
        navigate(`/shop/product/${getCurrentProductId}`);
    };




    

    return (
        <div className='container mx-auto px-4 sm:px-6 py-8 max-w-7xl'>
            {/* Search Input */}
            <div className="flex justify-center mb-10">
                <div className="w-full max-w-2xl relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input 
                        value={keyword} 
                        onChange={(e) => setKeyword(e.target.value)}
                        className="pl-12 pr-6 h-12 sm:h-14 rounded-xl border-2 border-gray-200 focus:border-black focus-visible:ring-0 text-base shadow-sm hover:shadow-md transition-shadow"
                        placeholder="Search for products..."
                    />
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                <AnimatePresence>
                    {searchResults?.length > 0 ? (
                        searchResults.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                <ShoppingProductTile
                                handleAddToCart={handleAddToCart} 
                                    product={item}
                                    handleGetProductDetails={handleGetProductDetails}
                                    className="h-full"
                                />
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            className="col-span-full min-h-[50vh] flex flex-col items-center justify-center text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="text-4xl mb-4">🔍</div>
                            <h2 className="text-2xl font-medium text-gray-800 mb-2">
                                {keyword ? "No results found" : "Start searching"}
                            </h2>
                            <p className="text-gray-500">
                                {keyword 
                                    ? "We couldn't find any matching products"
                                    : "Type your search query above"}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Product Options Modal */}
            <ProductOptionsModal 
                isOpen={isOptionsModalOpen} 
                onClose={() => setIsOptionsModalOpen(false)} 
                product={selectedProduct}
                onAddToCart={() => {
                    setIsOptionsModalOpen(false);
                    dispatch(fetchCartItems(user?._id || user?.id));
                }}
            />
        </div>
    )
}

export default SearchProducts