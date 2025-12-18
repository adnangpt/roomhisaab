export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
      {...props}
    />
  );
}

export function GroupSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function PeriodSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2 w-1/2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="w-20 h-8 rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ExpenseSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="space-y-2 pl-13">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function MemberSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ))}
    </div>
  );
}
