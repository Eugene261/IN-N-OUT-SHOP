// Utility functions for proper scrolling behavior
import { useEffect } from 'react';

export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'instant'
  });
};

export const scrollToSection = (sectionId, offset = 104) => {
  // Offset for fixed header (topbar + main header)
  const element = document.getElementById(sectionId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  } else {
    // If section not found, scroll to top
    scrollToTop();
  }
};

export const handleNavigationScroll = (path, navigate) => {
  // Navigate first
  navigate(path);
  
  // Add a small delay to ensure the page has loaded
  setTimeout(() => {
    scrollToTop();
  }, 100);
};

// Hook to handle scroll restoration
export const useScrollToTop = (dependencies = []) => {
  useEffect(() => {
    scrollToTop(false); // Instant scroll to top when dependencies change
  }, dependencies);
};

// Function to handle page navigation with proper scroll
export const navigateWithScroll = (navigate, path) => {
  navigate(path);
  // Use setTimeout to ensure navigation completes before scrolling
  setTimeout(() => {
    scrollToTop();
  }, 50);
}; 