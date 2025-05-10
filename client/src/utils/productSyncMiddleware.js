// Middleware to synchronize product updates between admin and shop slices
import { EditProduct } from '../store/admin/product-slice';
import { updateShopProduct, fetchProductDetails } from '../store/shop/product-slice';

// This middleware listens for admin product updates and triggers shop product updates
const productSyncMiddleware = store => next => action => {
  // First, pass the action through to the next middleware/reducer
  const result = next(action);
  
  // Check if this is a successful product update from the admin side
  if (EditProduct.fulfilled.match(action) && action.payload?.success && action.payload?.data) {
    console.log('Product sync middleware: Admin product updated, updating shop product');
    
    // Dispatch action to update the shop product
    store.dispatch(updateShopProduct(action.payload.data));
  }
  
  return result;
};

export default productSyncMiddleware;
