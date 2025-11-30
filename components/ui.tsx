
import React from 'react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-shadow/80 backdrop-blur-sm border border-gold/20 rounded-sm p-4 shadow-lg transition-all hover:border-gold/40 hover:shadow-gold ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 border-b border-gold/10 pb-2">
        {title && <h3 className="text-lg font-cinzel font-semibold text-gold tracking-wide">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="text-silver">{children}</div>
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-sm font-cinzel font-medium transition-all focus:outline-none focus:ring-1 focus:ring-gold focus:ring-offset-1 focus:ring-offset-obsidian disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Primary: Ethereal Violet background, Gold text/glow
    primary: "bg-violet/20 border border-violet/50 text-violet-light hover:bg-violet/30 hover:border-violet hover:shadow-arcane hover:text-white",
    
    // Secondary: Shadow background, Gold border
    secondary: "bg-shadow border border-gold/30 text-gold hover:border-gold hover:bg-gold/10 hover:shadow-gold",
    
    // Danger: Dark Red
    danger: "bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 hover:border-red-800",
    
    // Ghost: Subtle
    ghost: "hover:bg-shadow text-silver hover:text-gold",
  };

  const sizes = {
    sm: "h-7 px-3 text-xs",
    md: "h-9 px-4 py-2 text-sm",
    lg: "h-11 px-8 text-base",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-xs font-cinzel text-gold/80 mb-1 tracking-wide">{label}</label>}
    <input
      className={`flex h-9 w-full rounded-sm border border-twilight/50 bg-obsidian/50 px-3 py-1 text-sm text-silver placeholder:text-twilight focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50 font-sans ${className}`}
      {...props}
    />
  </div>
);

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, className = '', ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-xs font-cinzel text-gold/80 mb-1 tracking-wide">{label}</label>}
    <textarea
      className={`flex min-h-[80px] w-full rounded-sm border border-twilight/50 bg-obsidian/50 px-3 py-2 text-sm text-silver placeholder:text-twilight focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50 font-sans ${className}`}
      {...props}
    />
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray' }> = ({ children, color = 'gray' }) => {
    const colors = {
        // Green -> Emerald/Sage
        green: 'bg-green-900/20 text-green-400 border-green-900/40',
        // Red -> Crimson
        red: 'bg-red-950/40 text-red-400 border-red-900/40',
        // Blue -> Twilight
        blue: 'bg-twilight/30 text-blue-300 border-twilight',
        // Yellow -> Gold
        yellow: 'bg-gold/10 text-gold border-gold/30',
        // Gray -> Silver
        gray: 'bg-shadow text-silver/60 border-twilight/30',
    };
    return (
        <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-cinzel font-semibold tracking-wider transition-colors ${colors[color]}`}>
            {children}
        </span>
    );
}

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-shadow border border-gold/30 rounded-sm shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gold/20 bg-gradient-to-r from-shadow to-obsidian">
          <h2 className="text-xl font-cinzel font-bold text-gold glow-gold">{title}</h2>
          <button onClick={onClose} className="text-twilight hover:text-gold transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Confirm Modal ---
export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-silver/80 font-serif leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-twilight/20">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  );
};
