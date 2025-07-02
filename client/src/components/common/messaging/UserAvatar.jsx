import React, { useState } from 'react';
import { User } from 'lucide-react';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showOnlineIndicator = false, 
  isOnline = false,
  onClick = null 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-20 h-20 text-3xl'
  };

  const indicatorSizes = {
    xs: 'w-1.5 h-1.5 -top-0.5 -right-0.5',
    sm: 'w-2 h-2 -top-0.5 -right-0.5',
    md: 'w-3 h-3 -top-1 -right-1',
    lg: 'w-3.5 h-3.5 -top-1 -right-1',
    xl: 'w-4 h-4 -top-1 -right-1',
    '2xl': 'w-5 h-5 -top-1 -right-1'
  };

  // Get user data safely
  const userName = user?.userName || user?.name || 'Unknown User';
  const userAvatar = user?.avatar;
  const userRole = user?.role;
  
  // Generate consistent colors based on username
  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-orange-500 to-orange-600'
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get initials
  const getInitials = (name) => {
    if (!name || name === 'Unknown User') return 'U';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
  };

  // Determine if we should show profile picture
  const shouldShowImage = userAvatar && 
                          userAvatar.trim() !== '' && 
                          !imageError &&
                          !userAvatar.startsWith('data:image/'); // Avoid base64 images

  const avatarClasses = `
    ${sizeClasses[size]} 
    rounded-2xl 
    flex 
    items-center 
    justify-center 
    font-bold 
    shadow-lg 
    ${onClick ? 'cursor-pointer hover:shadow-xl transition-all duration-200' : ''}
    ${className}
  `;

  const content = shouldShowImage ? (
    <img
      src={userAvatar}
      alt={`${userName}'s avatar`}
      className="w-full h-full rounded-2xl object-cover"
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  ) : (
    <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(userName)} rounded-2xl flex items-center justify-center text-white`}>
      {getInitials(userName)}
    </div>
  );

  return (
    <div className="relative inline-block" onClick={onClick}>
      <div className={avatarClasses}>
        {content}
      </div>
      
      {/* Online indicator */}
      {showOnlineIndicator && (
        <div className={`
          absolute 
          ${indicatorSizes[size]} 
          ${isOnline ? 'bg-green-400' : 'bg-gray-400'} 
          rounded-full 
          border-2 
          border-white 
          ${isOnline ? 'animate-pulse' : ''}
        `} />
      )}
      
      {/* Role badge for super admin */}
      {userRole === 'superAdmin' && (size === 'lg' || size === 'xl' || size === '2xl') && (
        <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
          SA
        </div>
      )}
    </div>
  );
};

export default UserAvatar; 