'use client';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    active: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25',
    closed: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25',
    completed: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = {
    active: { label: 'Active', variant: 'active', icon: '🟢' },
    closed: { label: 'Pending Confirmation', variant: 'closed', icon: '🟡' },
    completed: { label: 'Completed', variant: 'completed', icon: '✅' },
  };
  
  const { label, variant, icon } = config[status] || config.active;
  
  return (
    <Badge variant={variant} size="md">
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
}
