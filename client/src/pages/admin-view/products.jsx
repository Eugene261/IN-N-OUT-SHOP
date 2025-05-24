import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import React, { Fragment, useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import CommonForm from '@/components/common/form';
import { addProductFormElements } from '@/config';
import MultipleImageUpload from '@/components/admin-view/multipleImageUpload';
import { useDispatch, useSelector } from 'react-redux';
import { addNewProduct, DeleteProduct, EditProduct, fetchAllProducts, updateProductList } from '@/store/admin/product-slice';
import { updateShopProduct } from '@/store/shop/product-slice';
import { updateProduct } from '@/utils/productUpdater';
import { toast } from 'sonner';
import AdminProductTile from '@/components/admin-view/productTile';
import DeleteConfirmationDialog from '@/components/admin-view/DeleteConfirmationDialog';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';

const initialFormData = {
  image: null,
  additionalImages: [], // Array for additional images
  title: '',
  description: '',
  category: '',
  subCategory: '',
  gender: '',
  brand: '',
  sizes: [], // Initialize as empty array
  colors: [], // Initialize as empty array
  price: '',
  salePrice: '',
  totalStock: '',
  isBestseller: false,
  isNewArrival: false
}

function AdminProducts() {
  const [openCreateProductsDialog, setOpenCreateProductsDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [additionalImageUrls, setAdditionalImageUrls] = useState([]);
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  
  // States for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Get products and current user from redux store
  const { productList, isLoading, error } = useSelector(state => state.adminProducts);
  const { user } = useSelector(state => state.auth);
  const { categories, subcategories, brands, sizes, colors } = useSelector(state => state.taxonomy);
  
  const dispatch = useDispatch(); 

  // Track refresh key to force re-render when products are updated
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Reference to the product container
  const productContainerRef = React.useRef(null);

  const onSubmit = async (evt) => {
    evt.preventDefault();
    
    try {
      // Convert form data for submission (ensure names are properly formatted)
      const submissionData = {
        ...formData,
        sizes: formData.sizes || [],
        colors: formData.colors || [],
        additionalImages: additionalImageUrls || []
      };
      
      // Ensure category and subcategory values are stored as their display names
      // The form uses lowercase IDs but we want to store the actual display names
      if (submissionData.category && categories.length > 0) {
        const categoryObj = categories.find(cat => cat.name.toLowerCase() === submissionData.category);
        if (categoryObj) {
          submissionData.category = categoryObj.name;
        }
      }
      
      if (submissionData.subCategory && subcategories.length > 0) {
        const subcategoryObj = subcategories.find(subcat => subcat.name.toLowerCase() === submissionData.subCategory);
        if (subcategoryObj) {
          submissionData.subCategory = subcategoryObj.name;
        }
      }
      
      if (submissionData.brand && brands.length > 0) {
        const brandObj = brands.find(brand => brand.name.toLowerCase() === submissionData.brand);
        if (brandObj) {
          submissionData.brand = brandObj.name;
        }
      }

      if (currentEditedId !== null) {
        // Handle product update
        toast.loading('Updating product...', { id: 'product-update' });
        
        // Ensure additionalImages are properly included
        const updatedSubmissionData = {
          ...submissionData,
          // If new additional images were uploaded, use those
          // Otherwise, preserve the existing ones from formData
          additionalImages: additionalImageUrls.length > 0 
            ? additionalImageUrls 
            : (formData.additionalImages || [])
        };
        
        console.log('Updating product with ID:', currentEditedId);
        console.log('Submission data with preserved images:', updatedSubmissionData);
        console.log('Additional images being sent:', updatedSubmissionData.additionalImages);
        
        // Use Redux to update the product
        const result = await dispatch(EditProduct({
          id: currentEditedId,
          formData: updatedSubmissionData
        })).unwrap();
        
        console.log('Edit product result:', result);
        
        if (result.success) {
          // Reset form state
          setFormData(initialFormData);
          setOpenCreateProductsDialog(false);
          setCurrentEditedId(null);
          setAdditionalImageFiles([]);
          setAdditionalImageUrls([]);
          
          // Force a re-render
          setRefreshKey(prev => prev + 1);
          
          // Directly update the shop product state with the updated product data
          console.log('Admin: Updating shop product with data:', result.data);
          dispatch(updateShopProduct(result.data));
          
          // Add a small delay before showing success toast to ensure state updates are processed
          setTimeout(() => {
            // Show success toast with information about refreshing
            toast.success(
              'Product updated successfully. Please refresh the shop page to see changes.',
              { id: 'product-update', duration: 5000 }
            );
          }, 100);
          
          // The productSyncMiddleware will handle the re-fetching of product details
        } else {
          toast.error('Failed to update product', { id: 'product-update' });
        }
      } else {
        // Handle new product creation
        const result = await dispatch(addNewProduct({
          ...submissionData,
          image: uploadedImageUrl,
          additionalImages: additionalImageUrls
        })).unwrap();
        
        if (result.success) {
          await dispatch(fetchAllProducts());
          setOpenCreateProductsDialog(false);
          setImageFile(null);
          setAdditionalImageFiles([]);
          setAdditionalImageUrls([]);
          setFormData(initialFormData);
          toast.success('Product added successfully', {
            position: 'top-center',
            duration: 2000
          });
        } else {
          toast.error(result.message || 'Failed to add product', {
            position: 'top-center',
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('Error in product submission:', error);
      toast.error('Error: ' + (error.message || 'Unknown error'), { id: 'product-update' });
    }
  };

  // Function to request product deletion
  function handleDeleteRequest(product) {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  }

  // Function to directly update a product in the local state
  const updateLocalProduct = (updatedProduct) => {
    if (!updatedProduct || !updatedProduct._id) return;
    
    console.log('Directly updating product in local state:', updatedProduct._id);
    
    // Update the local state
    setLocalProducts(prevProducts => {
      const newProducts = prevProducts.map(product => 
        product._id === updatedProduct._id ? updatedProduct : product
      );
      return newProducts;
    });
    
    // Force a re-render with a new key
    setRefreshKey(prev => prev + 1);
    
    // Schedule a forced update after a short delay to ensure the DOM has updated
    setTimeout(() => {
      forceUpdate(updatedProduct);
    }, 100);
  };
  
  // Function to force update the UI by directly manipulating the DOM if needed
  const forceUpdate = (updatedProduct) => {
    if (!updatedProduct) return;
    
    console.log('Force updating product in DOM:', updatedProduct._id);
    
    // First try to update through React's normal mechanisms
    setRefreshKey(prev => prev + 1);
    
    // As a fallback, directly update any product title elements in the DOM
    // This is a last resort to ensure the UI reflects the changes
    try {
      const productElements = document.querySelectorAll(`[data-product-id="${updatedProduct._id}"]`);
      if (productElements.length > 0) {
        productElements.forEach(el => {
          // Find and update title elements
          const titleEl = el.querySelector('.product-title');
          if (titleEl) titleEl.textContent = updatedProduct.title;
          
          // Find and update price elements
          const priceEl = el.querySelector('.product-price');
          if (priceEl) priceEl.textContent = `GHS${updatedProduct.price}`;
          
          console.log('Directly updated DOM element for product:', updatedProduct._id);
        });
      }
    } catch (error) {
      console.error('Error during direct DOM update:', error);
    }
  };

  // Function for actual deletion after confirmation
  function confirmDelete() {
    dispatch(DeleteProduct({ id: productToDelete._id })).then(data => {
      if(data?.payload?.success) {
        dispatch(fetchAllProducts());
        toast.success('Product deleted successfully', {
          position: 'top-center',
          duration: 2000
        });
      } else {
        toast.error(data?.payload?.message || 'Failed to delete product', {
          position: 'top-center',
          duration: 2000
        });
      }
    });
  }

  // Validate the form with multiselect fields included
  function isFormValid() {
    // If new product, require main image
    if (currentEditedId === null && !uploadedImageUrl) {
      return false;
    }
    
    // Basic validation for required fields
    const requiredFields = ['title', 'description', 'category', 'gender', 'brand', 'price', 'totalStock'];
    const hasRequiredFields = requiredFields.every(key => 
      formData[key] !== '' && formData[key] !== null && formData[key] !== undefined
    );
    
    // Check sizes array - still required
    const hasSizes = Array.isArray(formData.sizes) && formData.sizes.length > 0;
    
    // Colors are now optional - don't include in validation
    
    return hasRequiredFields && hasSizes;
  }

  // Calculate stock summary
  const [stockSummary, setStockSummary] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });

  useEffect(() => {
    // Fetch products when component mounts and user is authenticated
    console.log('User in products page:', user);
    // Check for either id or _id since the JWT token might use either format
    if (user && (user.id || user._id)) {
      console.log('Dispatching fetchAllProducts with user ID:', user.id || user._id);
      dispatch(fetchAllProducts());
      // Also fetch taxonomy data for dynamic form options
      dispatch(fetchAllTaxonomyData());
    } else {
      console.log('User not authenticated or missing ID');
    }
  }, [dispatch, user]);
  
  // Log when the product list changes
  useEffect(() => {
    console.log('ProductList updated from Redux:', productList?.length);
    // Force a re-render when the product list changes
    setRefreshKey(prev => prev + 1);
  }, [productList]);

  // Generate dynamic form elements using taxonomy data
  const getDynamicFormElements = () => {
    const baseFormElements = [...addProductFormElements];
    
    // Update category options
    const categoryIndex = baseFormElements.findIndex(el => el.name === 'category');
    if (categoryIndex !== -1 && categories.length > 0) {
      baseFormElements[categoryIndex] = {
        ...baseFormElements[categoryIndex],
        options: categories.map(cat => ({
          id: cat.name.toLowerCase(), // Use lowercase name as ID for consistency 
          label: cat.name,
          _id: cat._id // Keep the actual ID for reference
        }))
      };
    }
    
    // Update subcategory options
    const subcategoryIndex = baseFormElements.findIndex(el => el.name === 'subCategory');
    if (subcategoryIndex !== -1) {
      baseFormElements[subcategoryIndex] = {
        ...baseFormElements[subcategoryIndex],
        dynamicOptions: true,
        options: subcategories.map(subcat => ({
          id: subcat.name.toLowerCase(), // Use lowercase name as ID
          label: subcat.name,
          _id: subcat._id, // Keep the actual ID for reference
          // Extract category name properly whether it's populated or not
          categories: [typeof subcat.category === 'object' ? subcat.category.name.toLowerCase() : '']
        }))
      };
    }
    
    // Update brand options with real data
    const brandIndex = baseFormElements.findIndex(el => el.name === 'brand');
    if (brandIndex !== -1 && brands.length > 0) {
      baseFormElements[brandIndex] = {
        ...baseFormElements[brandIndex],
        options: brands.map(brand => ({
          id: brand.name.toLowerCase(), // Use lowercase name as ID
          label: brand.name,
          _id: brand._id // Keep the actual ID for reference
        }))
      };
    }
    
    // Update size options with real data
    const sizeIndex = baseFormElements.findIndex(el => el.name === 'sizes');
    if (sizeIndex !== -1 && sizes.length > 0) {
      baseFormElements[sizeIndex] = {
        ...baseFormElements[sizeIndex],
        options: sizes.map(size => ({
          id: size.name.toLowerCase(), // Use lowercase name as ID
          label: size.name,
          _id: size._id, // Keep the actual ID for reference
          categories: size.category ? [size.category.toLowerCase()] : []
        }))
      };
    }
    
    // Update color options with real data
    const colorIndex = baseFormElements.findIndex(el => el.name === 'colors');
    if (colorIndex !== -1 && colors.length > 0) {
      baseFormElements[colorIndex] = {
        ...baseFormElements[colorIndex],
        options: colors.map(color => ({
          id: color.name.toLowerCase(), // Use lowercase name as ID
          label: color.name,
          _id: color._id // Keep the actual ID for reference
        }))
      };
    }
    
    return baseFormElements;
  };

  // Calculate stock summary when productList changes
  useEffect(() => {
    if (productList && productList.length > 0) {
      const summary = {
        totalProducts: productList.length,
        totalStock: productList.reduce((sum, product) => sum + (parseInt(product.totalStock) || 0), 0),
        lowStockProducts: productList.filter(product => parseInt(product.totalStock) > 0 && parseInt(product.totalStock) <= 10).length,
        outOfStockProducts: productList.filter(product => parseInt(product.totalStock) <= 0).length
      };
      setStockSummary(summary);
    } else {
      setStockSummary({
        totalProducts: 0,
        totalStock: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0
      });
    }
  }, [productList]);

  return (
    <Fragment>
      <div className="mb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">My Products</h1>
            <p className="text-gray-500">
              {user?.userName ? `Manage products created by ${user.userName}` : 'Manage your products'}
            </p>
          </div>
          <button 
            onClick={() => setOpenCreateProductsDialog(true)}
            className="mt-3 md:mt-0 px-4 py-2 rounded-lg bg-gradient-to-r 
            from-purple-700 to-cyan-700 text-white font-medium 
            hover:from-purple-600 hover:to-cyan-600 
            transition-colors duration-300 flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="h-5 w-5" /> Add New Product
          </button>
        </div>
        
        {/* Stock Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="text-2xl font-bold text-gray-900">{stockSummary.totalProducts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Items in Stock</h3>
            <p className="text-2xl font-bold text-gray-900">{stockSummary.totalStock}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
            <p className="text-2xl font-bold text-yellow-600">{stockSummary.lowStockProducts}</p>
            <p className="text-xs text-gray-500">Products with 10 or fewer items</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
            <p className="text-2xl font-bold text-red-600">{stockSummary.outOfStockProducts}</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{typeof error === 'object' ? (error.message || JSON.stringify(error)) : error}</p>
          </div>
        )}
      </div>
      
      {/* Debug information */}
      

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {Array.isArray(productList) && productList.length > 0 ? (
            <div 
              ref={productContainerRef}
              className="grid gap-4 md:grid-cols-3 lg:grid-cols-4" 
              key={`product-container-${refreshKey}`}
              id="product-container"
            >
              {productList.map(productItem => {
                // Log each product to verify it's being rendered
                console.log(`Rendering product: ${productItem._id}, title: ${productItem.title}`);
                return (
                  <AdminProductTile
                    setFormData={setFormData}
                    setOpenCreateProductsDialog={setOpenCreateProductsDialog}
                    setCurrentEditedId={setCurrentEditedId}
                    key={`product-${productItem._id}-${Date.now()}`} // Use current timestamp to force re-render
                    product={productItem} 
                    handleDelete={() => handleDeleteRequest(productItem)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
              <h3 className="text-lg font-medium text-gray-700">No products found</h3>
              <p className="text-gray-500 mt-2">
                {user ? "You haven't created any products yet." : "Please log in to manage your products."}
              </p>
              <button 
                onClick={() => setOpenCreateProductsDialog(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r 
                from-purple-700 to-cyan-700 text-white font-medium 
                hover:from-purple-600 hover:to-cyan-600 
                transition-colors duration-300 inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" /> Create Your First Product
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        productToDelete={productToDelete}
        onConfirmDelete={confirmDelete}
      />
      
      <Sheet 
        open={openCreateProductsDialog} 
        onOpenChange={() => {
          setOpenCreateProductsDialog(false);
          setCurrentEditedId(null);
          setFormData(initialFormData);
        }}
      >
        <SheetContent 
          side="right" 
          className="overflow-auto w-full max-w-md sm:max-w-lg"
          aria-describedby="product-form-description"
        >
          <SheetHeader>
            <SheetTitle>
              {
                currentEditedId !== null ? 
                'Edit Product' : 'Add New Product'
              }
            </SheetTitle>
            <SheetDescription id="product-form-description">
              Fill out the form below to add a new product to your inventory.
            </SheetDescription>
          </SheetHeader>
          <MultipleImageUpload 
            mainImageFile={imageFile}
            setMainImageFile={setImageFile}
            additionalImageFiles={additionalImageFiles}
            setAdditionalImageFiles={setAdditionalImageFiles}
            mainImageUrl={uploadedImageUrl}
            setMainImageUrl={setUploadedImageUrl}
            additionalImageUrls={additionalImageUrls}
            setAdditionalImageUrls={setAdditionalImageUrls}
            setImageLoadingState={setImageLoadingState}
            imageLoadingState={imageLoadingState}
            isEditMode={currentEditedId !== null}
          />
          <p id="product-form-description" className="sr-only">Form to add a new product</p>
          <div className="py-6">
          <CommonForm
            onSubmit={onSubmit}
            formData={formData}
            setFormData={setFormData}
            buttonText={currentEditedId !== null ? 'Update Product' : 'Add Product'}
            formControls={getDynamicFormElements()}
            buttonDisabled={!isFormValid() || imageLoadingState}
          />
          </div>
        </SheetContent>
      </Sheet>
    </Fragment>
  )
}

export default AdminProducts;