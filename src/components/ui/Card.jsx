'use client';

export function Card({ children, className = '', onClick, hoverable = false }) {
  return (
    <div 
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${hoverable ? 'hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-900/50 cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{ transition: 'all 0.3s ease-in-out' }}
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
