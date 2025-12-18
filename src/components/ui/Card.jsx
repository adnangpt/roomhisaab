'use client';

export function Card({ children, className = '', onClick, hoverable = false }) {
  return (
    <div 
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-t border-slate-100 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
}
