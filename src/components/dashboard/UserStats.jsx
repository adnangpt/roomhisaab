import { useUserStats } from '@/hooks/useUserStats';
import { StatsSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/calculations';
import { Card, CardContent } from '@/components/ui/Card';

export function UserStats() {
  const { totalPaid, totalShare, netBalance, expenseCount, loading } = useUserStats();

  if (loading) return <StatsSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
        <CardContent className="p-4">
          <p className="text-indigo-100 text-xs mb-1">Net Balance</p>
          <p className="text-xl font-bold">
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
          </p>
          <p className="text-[10px] text-indigo-200 mt-1">
            {netBalance > 0 ? 'To receive' : netBalance < 0 ? 'To pay' : 'Settled up'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Total Paid</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {expenseCount} expenses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Total Share</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalShare)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Lifetime usage
          </p>
        </CardContent>
      </Card>

      <Card>
         <CardContent className="p-4">
           <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">To Receive</p>
           <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
             {formatCurrency(Math.max(0, netBalance))}
           </p>
           <p className="text-[10px] text-slate-400 mt-1">
             From others
           </p>
         </CardContent>
      </Card>
    </div>
  );
}
