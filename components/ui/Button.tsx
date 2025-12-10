import React from 'react';
import { motion } from 'framer-motion';

/**
 * Button Component - Interactive button with micro-animations
 * 
 * Features:
 * - Framer Motion hover/tap animations
 * - Loading state with spinner
 * - Multiple variants and sizes
 * - Accessible focus styles via .lr-focus
 * 
 * @example
 * <Button variant="primary" loading={isLoading} onClick={handleClick}>
 *   Save Changes
 * </Button>
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const LoadingSpinner = () => (
  <svg 
    className="lr-spin -ml-1 mr-2 h-4 w-4" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled,
  className = '', 
  ...props 
}) => {
  const baseStyle = `
    inline-flex 
    items-center 
    justify-center 
    rounded-lg 
    font-cinzel 
    font-medium 
    transition-all 
    duration-200
    lr-focus
    disabled:opacity-50 
    disabled:pointer-events-none
    disabled:cursor-not-allowed
  `;
  
  const variants = {
    primary: `
      bg-violet/20 
      border 
      border-violet/50 
      text-violet-light 
      hover:bg-violet/30 
      hover:border-violet 
      hover:shadow-arcane 
      hover:text-white
    `,
    secondary: `
      bg-[#09090B] 
      border 
      border-gold/30 
      text-gold 
      hover:border-gold 
      hover:bg-gold/10 
      hover:shadow-gold
    `,
    danger: `
      bg-red-950/30 
      text-red-400 
      hover:bg-red-900/50 
      border 
      border-red-900/50 
      hover:border-red-800
    `,
    ghost: `
      hover:bg-shadow 
      text-white/70 
      hover:text-gold
      border
      border-transparent
    `,
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-5 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 17 
      }}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </motion.button>
  );
};

export default Button;
