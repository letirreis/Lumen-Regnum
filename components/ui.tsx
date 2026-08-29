import React, { useId, useEffect, useRef } from 'react';

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, onClick }) => (
  // Updated: bg-[#13141A]/98 for very high opacity/contrast against the gray background
  <div
    onClick={onClick}
    className={`bg-[#13141A]/98 backdrop-blur-sm border border-gold/20 rounded-sm p-4 shadow-lg transition-all hover:border-gold/40 hover:shadow-gold ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 border-b border-gold/10 pb-2">
        {title && <h3 className="text-lg font-cinzel font-semibold text-gold tracking-wide">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="text-white">{children}</div>
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', loading = false, disabled, className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-sm font-cinzel font-medium transition-all focus:outline-none focus:ring-1 focus:ring-gold focus:ring-offset-1 focus:ring-offset-obsidian disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    // Primary: Ethereal Violet background, Gold text/glow
    primary: "bg-violet/20 border border-violet/50 text-violet-light hover:bg-violet/30 hover:border-violet hover:shadow-arcane hover:text-white",

    // Secondary: Shadow background, Gold border
    secondary: "bg-[#09090B] border border-gold/30 text-gold hover:border-gold hover:bg-gold/10 hover:shadow-gold",

    // Danger: Dark Red
    danger: "bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 hover:border-red-800",

    // Ghost: Subtle
    ghost: "hover:bg-shadow text-white/70 hover:text-gold",
  };

  const sizes = {
    sm: "h-7 px-3 text-xs",
    md: "h-9 px-4 py-2 text-sm",
    lg: "h-11 px-8 text-base",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', id, ...props }) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="mb-4">
      {label && (
          <label htmlFor={inputId} className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
              {label}
          </label>
      )}
      <input
        id={inputId}
        // Updated: bg-[#09090B] (Almost Black) + text-white for maximum typing visibility
        className={`flex h-10 w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50 font-sans ${className}`}
        {...props}
      />
    </div>
  );
};

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, className = '', id, ...props }) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <div className="mb-4">
      {label && (
          <label htmlFor={textareaId} className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
              {label}
          </label>
      )}
      <textarea
        id={textareaId}
        className={`flex min-h-[80px] w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50 font-sans ${className}`}
        {...props}
      />
    </div>
  );
};

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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#13141A] border border-gold/30 rounded-sm shadow-2xl animate-in fade-in zoom-in duration-300 focus:outline-none"
      >
        <div className="flex justify-between items-center p-4 border-b border-gold/20 bg-gradient-to-r from-shadow to-obsidian">
          <h2 id={titleId} className="text-xl font-cinzel font-bold text-gold glow-gold">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="text-twilight hover:text-gold transition-colors">✕</button>
        </div>
        <div className="p-6 text-white">{children}</div>
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
        <p className="text-white/80 font-serif leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-twilight/20">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  );
};