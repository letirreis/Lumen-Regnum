import React from 'react';

/**
 * Card Component - Polished container with gradient border
 * 
 * Features:
 * - Gradient hairline border via .fancy-border class
 * - Hover lift animation
 * - Soft shadow with glow
 * - Optional title and action slot
 * 
 * @example
 * <Card title="Character Info" action={<Button size="sm">Edit</Button>}>
 *   <p>Content goes here</p>
 * </Card>
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  hover?: boolean; // Enable hover lift effect
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  action,
  onClick,
  hover = true 
}) => {
  const hoverClasses = hover 
    ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet/20' 
    : '';
  
  const clickableClasses = onClick 
    ? 'cursor-pointer' 
    : '';

  return (
    <div 
      className={`
        fancy-border
        bg-[#13141A]/98 
        backdrop-blur-sm 
        rounded-lg 
        p-4 
        shadow-md
        transition-all 
        duration-300 
        ${hoverClasses}
        ${clickableClasses}
        ${className}
      `}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-4 border-b border-gold/10 pb-3">
          {title && (
            <h3 className="text-lg font-cinzel font-semibold text-gold tracking-wide">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-white">
        {children}
      </div>
    </div>
  );
};

export default Card;
