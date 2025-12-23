'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGroup, useGroups } from '@/hooks/useGroups';
import { usePeriod, usePeriods } from '@/hooks/usePeriods';
import { useExpenses } from '@/hooks/useExpenses';
import { useNotes } from '@/hooks/useNotes';
import { getUsersByIds } from '@/lib/auth';
import { formatCurrency, calculateNetBalances, calculateExternalShares, calculateTotalLiabilities } from '@/lib/calculations';
import { Navbar, PageContainer, PageHeader } from '@/components/layout/Layout';
import { ExpenseCard, AddExpenseModal, EditExpenseModal } from '@/components/expenses/ExpenseComponents';
import { CollapsibleExpenseGroups } from '@/components/expenses/CollapsibleExpenseGroups';
import { PeriodSettingsModal, AddMemberToPeriodModal } from '@/components/periods/PeriodComponents';
import { SettlementView, NotesSection } from '@/components/settlements/SettlementComponents';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';

import { EmptyState, PageLoader } from '@/components/ui/EmptyState';
import { ExpenseSkeleton } from '@/components/ui/Skeleton';

export default function PeriodPage({ params }) {
  const { groupId, periodId } = use(params);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { showNotification } = useNotification();
  const { group, loading: groupLoading } = useGroup(groupId);
  const { updateElectricityUnit } = useGroups();
  const { period, loading: periodLoading } = usePeriod(periodId);
  const { closePeriod, confirmSettlement, completePeriod, updateMemberPreferences, addMemberToPeriod, deletePeriod } = usePeriods(groupId);
  const { expenses, loading: expensesLoading, addExpense, addBulkExpenses, deleteExpense, updateExpense, totalExpenses, expensesByType } = useExpenses(periodId);
  const { notes, loading: notesLoading, addNote } = useNotes(periodId);
  
  const [allMembers, setAllMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (group?.members) {
        setMembersLoading(true);
        try {
          const memberData = await getUsersByIds(group.members);
          setAllMembers(memberData);
        } catch (error) {
          console.error('Error fetching members:', error);
        } finally {
          setMembersLoading(false);
        }
      }
    };
    fetchMembers();
  }, [group?.members]);

  // Close member dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMemberDropdown && !event.target.closest('.member-dropdown-container')) {
        setShowMemberDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMemberDropdown]);

  const activeMembers = allMembers.filter(m => period?.activeMembers?.includes(m.id));

  const handleAddExpense = async (expenseData, isBulk = false) => {
    setActionLoading(true);
    try {
      if (isBulk) {
        const bulkData = expenseData.map(exp => ({ ...exp, groupId }));
        await addBulkExpenses(bulkData);
      } else {
        await addExpense({ ...expenseData, groupId });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId, createdBy, action = 'delete') => {
    if (action === 'edit') {
      const expense = expenses.find(e => e.id === expenseId);
      setEditingExpense(expense);
      setShowEditExpenseModal(true);
      return;
    }

    if (confirm('Are you sure you want to delete this expense?')) {
      setActionLoading(true);
      try {
        await deleteExpense(expenseId, createdBy);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleEditExpense = async (expenseId, expenseData) => {
    console.log('handleEditExpense called:', expenseId, expenseData);
    setActionLoading(true);
    try {
      await updateExpense(expenseId, expenseData);
      console.log('updateExpense success');
    } catch (err) {
      console.error('updateExpense error:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (confirm('Are you sure you want to close this period? Expenses will become read-only.')) {
      setActionLoading(true);
      try {
        await closePeriod(periodId);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleConfirmSettlement = async (userId) => {
    setActionLoading(true);
    try {
      await confirmSettlement(periodId, userId);
      
      // Auto-complete if all confirmed
      const updatedConfirmed = [...(period.confirmedBy || []), userId];
      if (period.activeMembers?.every(m => updatedConfirmed.includes(m))) {
        await completePeriod(periodId);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletePeriod = async () => {
    setActionLoading(true);
    try {
      await completePeriod(periodId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (text) => {
    setActionLoading(true);
    try {
      await addNote(text);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (preferences) => {
    setActionLoading(true);
    try {
      await updateMemberPreferences(periodId, preferences);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMemberToPeriod = async (memberIds) => {
    setActionLoading(true);
    try {
      await addMemberToPeriod(periodId, memberIds, period.activeMembers, period.memberPreferences);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateElectricity = async (unit) => {
    await updateElectricityUnit(groupId, unit);
  };

  const handleDeletePeriod = async () => {
    if (confirm('Are you sure you want to delete this ENTIRE period? This will delete all expenses within it and cannot be undone.')) {
      setActionLoading(true);
      try {
        await deletePeriod(periodId);
        router.push(`/group/${groupId}`);
      } catch (error) {
        console.error('Error deleting period:', error);
        showNotification('Failed to delete period', 'error');
        setActionLoading(false);
      }
    }
  };

  if (authLoading || groupLoading || periodLoading || expensesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <Navbar />
        <PageContainer>
          <div className="mb-6 animate-pulse">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
            <div className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          </div>

          {/* Expenses Skeleton */}
          <div className="space-y-3">
            <ExpenseSkeleton />
            <ExpenseSkeleton />
            <ExpenseSkeleton />
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!isAuthenticated || !group || !period) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10">
      <Navbar />
      <PageContainer className="animate-slide-in max-w-4xl mx-auto px-4">
        <PageHeader 
          title={period.name}
          subtitle={`${group.name} • ${activeMembers.length} members`}
          backHref={`/group/${groupId}`}
          action={
            <div className="flex items-center gap-2">
              <StatusBadge status={period.status} />
            </div>
          }
        />

        {/* Action Bar */}
        {period.status === 'active' && (
          <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Button 
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex-1 sm:flex-none"
            >
              <span className="mr-2">+</span>
              Add Expense
            </Button>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="secondary" 
                size="md"
                onClick={() => setShowAddMemberModal(true)}
                className="flex-1 sm:flex-none gap-2"
              >
                <span>👤</span>
                <span>Add Member</span>
              </Button>
              <Button 
                variant="secondary" 
                size="md"
                onClick={() => setShowSettingsModal(true)}
                className="flex-1 sm:flex-none gap-2"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </Button>
            </div>
          </div>
        )}

        {/* Summary Area */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2 flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Summary</h3>
            <div className="relative">
              <button
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <span>👥 {activeMembers.length} Members</span>
                <svg className={`w-3 h-3 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Members Dropdown */}
              {showMemberDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Members</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {activeMembers.map((member, index) => (
                      <div 
                        key={member.id} 
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {member.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {member.displayName}
                            {member.id === user?.uid && <span className="ml-1 text-xs text-indigo-600 dark:text-indigo-400">(You)</span>}
                          </p>
                          {member.phone && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{member.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform">
              <span className="text-8xl">📊</span>
            </div>
            <div className="relative">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Total Expenses
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(totalExpenses)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/{activeMembers.length} members</span>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {Object.entries(expensesByType).slice(0, 3).map(([type, amount]) => (
                  <div key={type} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {type}: {formatCurrency(amount)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Your Share Card */}
          {(() => {
            const balances = calculateNetBalances(expenses, period.activeMembers);
            const externalShares = calculateExternalShares(expenses);
            const totalLiabilities = calculateTotalLiabilities(balances, externalShares, period.activeMembers);
            const myTotal = totalLiabilities[user?.uid] || 0;
            const isOwed = myTotal >= 0;

            return (
              <div className={`relative overflow-hidden p-6 rounded-3xl border shadow-sm group hover:shadow-md transition-shadow ${
                isOwed 
                ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-100' 
                : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-100'
              }`}>
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
                  <span className="text-8xl">{isOwed ? '💰' : '💸'}</span>
                </div>
                <div className="relative">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isOwed ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {isOwed ? 'To Receive' : 'Your Share'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold ${isOwed ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {formatCurrency(Math.abs(myTotal))}
                    </span>
                    <span className="text-xs opacity-60 font-medium">
                      {isOwed ? 'from roomies' : 'to pay'}
                    </span>
                  </div>
                  <p className="mt-4 text-[11px] font-medium opacity-70">
                    {isOwed 
                      ? 'You spent more than your share. Settle up to get back.'
                      : 'You spent less than your share. Please settle with others.'
                    }
                  </p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Expense Breakdown */}
        {Object.keys(expensesByType).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="font-semibold text-slate-900 dark:text-white">Breakdown</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(expensesByType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{type}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Spending Summary */}
        {activeMembers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>👥</span> Member Spending
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {activeMembers.map(member => {
                const totalPaid = expenses
                  .filter(exp => exp.paidBy === member.id)
                  .reduce((sum, exp) => sum + exp.amount, 0);
                
                return (
                  <div key={member.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">
                      {member.displayName}
                    </p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 sticky top-16 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md py-2 z-10">
            <h3 className="font-semibold text-slate-900 dark:text-white">Expenses</h3>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {expenses.length} entries • {formatCurrency(totalExpenses)}
            </div>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon="💸"
              title="No expenses yet"
              description={period.status === 'active' 
                ? "Tap the + button below to add your first expense."
                : "This period has no expenses recorded."
              }
            />
          ) : (
            <CollapsibleExpenseGroups
              expenses={expenses}
              members={activeMembers}
              onDelete={handleDeleteExpense}
              onEdit={(expenseId) => handleDeleteExpense(expenseId, null, 'edit')}
              period={period}
            />
          )}
        </div>

        {/* Settlement Section */}
        {expenses.length > 0 && (
          <SettlementView
            period={period}
            expenses={expenses}
            members={activeMembers}
            onClosePeriod={handleClosePeriod}
            onConfirmSettlement={handleConfirmSettlement}
            onCompletePeriod={handleCompletePeriod}
            loading={actionLoading}
          />
        )}

        {/* Notes Section */}
        <div className="mt-6">
          <NotesSection
            notes={notes}
            onAddNote={handleAddNote}
            members={activeMembers}
            periodStatus={period.status}
            loading={actionLoading}
          />
        </div>



      </PageContainer>

      {/* FAB for Mobile */}
      {period.status === 'active' && (
        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95 sm:hidden"
        >
          <span className="text-2xl font-bold">+</span>
        </button>
      )}
      
      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSubmit={handleAddExpense}
        members={activeMembers}
        lastElectricityUnit={group?.lastElectricityUnit}
        totalRentAmount={period.totalRentAmount || group?.totalRentAmount}
        memberPreferences={period.memberPreferences}
        onUpdateElectricity={handleUpdateElectricity}
        expenseTypes={group?.expenseTypes}
        loading={actionLoading}
      />

      <PeriodSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        members={activeMembers}
        initialPreferences={period.memberPreferences}
        initialRentAmount={period.totalRentAmount || group.totalRentAmount}
        initialElectricityAmount={period.lastElectricityUnit ? null : null} // We don't store amount on period directly like rent yet, need to check logic. Wait, we just added it.
        // Actually, we don't need to pass initialElectricityAmount if we don't persist it on the period doc same as rent.
        // But let's stick to the task: connecting delete.
        initialElectricityUnit={period.lastElectricityUnit || group.lastElectricityUnit}
        onSave={handleSaveSettings}
        onDelete={handleDeletePeriod}
        loading={actionLoading}
      />

      <AddMemberToPeriodModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAdd={handleAddMemberToPeriod}
        groupMembers={allMembers}
        activeMemberIds={period.activeMembers || []}
        loading={actionLoading}
      />

      <EditExpenseModal
        isOpen={showEditExpenseModal}
        onClose={() => {
          setShowEditExpenseModal(false);
          setEditingExpense(null);
        }}
        onSubmit={handleEditExpense}
        members={activeMembers}
        expense={editingExpense}
        loading={actionLoading}
      />
    </div>
  );
}
