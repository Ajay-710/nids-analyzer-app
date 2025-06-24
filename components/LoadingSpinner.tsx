import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  color?: string; // e.g., 'blue-600', 'white', 'gray-700', 'zinc-300'
  textColor?: string; // e.g., 'text-gray-700', 'text-white', 'text-zinc-200'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text, 
  color = 'zinc-300', // Default to light gray for monochrome dark theme
  textColor = 'text-zinc-200' // Default to light gray for text on monochrome dark theme
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  const borderColorClass = color === 'white' ? 'border-white' : `border-${color}`;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`${sizeClasses[size]} ${borderColorClass} border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && <p className={`${textColor} text-lg`}>{text}</p>}
    </div>
  );
};