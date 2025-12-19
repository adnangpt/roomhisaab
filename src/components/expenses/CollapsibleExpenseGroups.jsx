'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ExpenseCard } from '@/components/expenses/ExpenseComponents';
import { formatCurrency } from '@/lib/calculations';

export function CollapsibleExpenseGroups({ expenses, members, onDelete, onEdit, period }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  // Separate external expenses (rent/electricity) from regular expenses
  const externalExpenses = expenses.filter(exp => exp.paidBy === '__EXTERNAL__');
  const regularExpenses = expenses.filter(exp => exp.paidBy !== '__EXTERNAL__');

  // Group regular expenses by payer
  const groupedByPayer = regularExpenses.reduce((groups, expense) => {
    const payerId = expense.paidBy;
    if (!groups[payerId]) {
      groups[payerId] = [];
    }
    groups[payerId].push(expense);
    return groups;
  }, {});

  const toggleGroup = (payerId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [payerId]: !prev[payerId]
    }));
  };

  return (
    <div className="space-y-4">
      {/* External Expenses (Rent/Electricity) - Always Visible */}
      {externalExpenses.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Shared Liabilities
          </h4>
          <div className="space-y-2">
            {externalExpenses.map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                members={members}
                onDelete={onDelete}
                onEdit={onEdit}
                period={period}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grouped by Payer - Collapsible */}
      {Object.entries(groupedByPayer).map(([payerId, payerExpenses]) => {
        const payer = members.find(m => m.id === payerId);
        const totalPaid = payerExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const isExpanded = expandedGroups[payerId];

        return (
          <div key={payerId}>
            <button
              onClick={() => toggleGroup(payerId)}
              className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {payer?.displayName || 'Unknown'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {payerExpenses.length} expense{payerExpenses.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(totalPaid)}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-2 pl-2">
                {payerExpenses.map(expense => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    members={members}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    period={period}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
