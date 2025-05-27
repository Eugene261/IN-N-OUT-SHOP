import { toast } from 'sonner';

// Store active toasts to prevent duplicates
const activeToasts = new Set();

/**
 * Show a toast with duplicate prevention
 * @param {string} type - Toast type (success, error, info, warning)
 * @param {string} message - Toast message
 * @param {Object} options - Additional toast options
 * @param {string} options.id - Unique identifier to prevent duplicates
 * @param {number} options.duration - Toast duration in milliseconds
 * @returns {string} Toast ID
 */
export const showToast = (type, message, options = {}) => {
  const { id, duration = 3000, ...otherOptions } = options;
  
  // Create a unique identifier for this toast
  const toastId = id || `${type}-${message}`;
  
  // Check if this toast is already active
  if (activeToasts.has(toastId)) {
    console.log('Preventing duplicate toast:', toastId);
    return toastId;
  }
  
  // Add to active toasts
  activeToasts.add(toastId);
  
  // Remove from active toasts after duration
  setTimeout(() => {
    activeToasts.delete(toastId);
  }, duration + 100); // Add small buffer
  
  // Show the toast
  const toastFunction = toast[type] || toast;
  return toastFunction(message, {
    id: toastId,
    duration,
    ...otherOptions
  });
};

/**
 * Convenience methods for different toast types
 */
export const toastSuccess = (message, options) => showToast('success', message, options);
export const toastError = (message, options) => showToast('error', message, options);
export const toastInfo = (message, options) => showToast('info', message, options);
export const toastWarning = (message, options) => showToast('warning', message, options);

/**
 * Clear all active toasts
 */
export const clearAllToasts = () => {
  activeToasts.clear();
  toast.dismiss();
};

/**
 * Clear specific toast
 */
export const clearToast = (id) => {
  activeToasts.delete(id);
  toast.dismiss(id);
}; 