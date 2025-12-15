import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'filter';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isActive?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  isActive = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded-md transition-colors duration-200';
  
  const variantStyles = {
    primary: 'bg-[#bc862d] text-white hover:bg-[#a67628] focus:ring-[#bc862d] cursor-pointer',
    secondary: 'bg-[#361951] text-white hover:bg-[#2a1340] focus:ring-[#361951] cursor-pointer',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 cursor-pointer',
    filter: isActive 
      ? 'bg-[#361951] text-white cursor-pointer' 
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300 cursor-pointer'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Cargando...' : children}
    </button>
  );
};
