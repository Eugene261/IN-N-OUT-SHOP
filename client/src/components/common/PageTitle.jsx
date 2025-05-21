import { useEffect } from 'react';

/**
 * Component to manage page titles throughout the application
 * @param {Object} props
 * @param {string} props.title - Page-specific title
 * @param {boolean} props.includeAppName - Whether to include app name in the title
 * @param {string} props.appName - App name to include if includeAppName is true
 * @param {string} props.separator - Separator between app name and page title
 */
const PageTitle = ({ 
  title, 
  includeAppName = true, 
  appName = 'IN-N-OUT', 
  separator = ' | ' 
}) => {
  useEffect(() => {
    // Set the document title when the component mounts or title changes
    const formattedTitle = includeAppName 
      ? `${title}${separator}${appName}` 
      : title;
    
    document.title = formattedTitle;
    
    // Reset title to default when the component unmounts
    return () => {
      document.title = 'IN-N-OUT';
    };
  }, [title, includeAppName, appName, separator]);

  // This component doesn't render anything visible
  return null;
};

export default PageTitle; 