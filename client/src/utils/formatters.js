/**
 * Utility functions for formatting dates, currency and other data
 */

/**
 * Format a date string or timestamp to a human-readable format
 * @param {string|Date|number} date - Date to format (string, Date object, or timestamp)
 * @param {string} format - Optional format specifier (default: 'short')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  try {
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'long':
        return dateObj.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'datetime':
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'time':
        return dateObj.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case 'iso':
        return dateObj.toISOString();
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Format error';
  }
};

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'GHS')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'GHS', locale = 'en-US') => {
  if (amount === undefined || amount === null) return 'N/A';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  }
};

/**
 * Format a number with thousand separators
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === undefined || number === null) return 'N/A';
  
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  } catch (error) {
    console.error('Number formatting error:', error);
    return parseFloat(number).toFixed(decimals);
  }
};

/**
 * Format a percentage value
 * @param {number} value - Value to format (0-1 or 0-100)
 * @param {boolean} convertFromDecimal - Whether value is in decimal (0-1) and should be converted
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, convertFromDecimal = true) => {
  if (value === undefined || value === null) return 'N/A';
  
  try {
    // If value is decimal (between 0-1) and convertFromDecimal is true, multiply by 100
    const percentValue = (convertFromDecimal && value >= 0 && value <= 1) 
      ? value * 100 
      : value;
      
    return `${parseFloat(percentValue).toFixed(1)}%`;
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return `${value}%`;
  }
};
