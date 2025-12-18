'use client';

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon && (
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <span className="text-4xl">{icon}</span>
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        className={`animate-spin ${sizes[size]} text-indigo-600`} 
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
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
