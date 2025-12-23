'use client';

import { useState } from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  fullWidth = false,
  ...props 
}) {
  const [ripples, setRipples] = useState([]);
  
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ripple-container btn-press';
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // Inline style for smooth transitions
  const transitionStyle = { transition: 'all 0.3s ease-in-out' };
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 text-white shadow-lg shadow-indigo-500/25 focus:ring-indigo-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 hover:shadow-md text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white focus:ring-slate-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5 text-white shadow-lg shadow-red-500/25 focus:ring-red-500',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-500',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 text-white shadow-lg shadow-emerald-500/25 focus:ring-emerald-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };
  
  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };
    
    setRipples((prev) => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };
  
  const handleClick = (e) => {
    if (!disabled && !loading) {
      createRipple(e);
      props.onClick?.(e);
    }
  };
  
  return (
    <button
      {...props}
      onClick={handleClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      style={transitionStyle}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function IconButton({ 
  children, 
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 btn-press hover:scale-110';
  const transitionStyle = { transition: 'all 0.3s ease-in-out' };
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 focus:ring-slate-500',
    danger: 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={transitionStyle}
      {...props}
    >
      {children}
    </button>
  );
}
