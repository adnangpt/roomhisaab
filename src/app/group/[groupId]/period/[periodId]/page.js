'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup, useGroups } from '@/hooks/useGroups';
import { usePeriod, usePeriods } from '@/hooks/usePeriods';
import { useExpenses } from '@/hooks/useExpenses';
import { useNotes } from '@/hooks/useNotes';
import { getUsersByIds } from '@/lib/auth';
import { formatCurrency } from '@/lib/calculations';
import { Navbar, PageContainer, PageHeader } from '@/components/layout/Layout';
import { ExpenseCard, AddExpenseModal, EditExpenseModal } from '@/components/expenses/ExpenseComponents';
import { PeriodSettingsModal, AddMemberToPeriodModal } from '@/components/periods/PeriodComponents';
import { SettlementView, NotesSection } from '@/components/settlements/SettlementComponents';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';

import { EmptyState, PageLoader } from '@/components/ui/EmptyState';
import { ExpenseSkeleton } from '@/components/ui/Skeleton';

export default function PeriodPage({ params }) {
  const { groupId, periodId } = use(params);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { group, loading: groupLoading } = useGroup(groupId);
  const { updateElectricityUnit } = useGroups();
  const { period, loading: periodLoading } = usePeriod(periodId);
  const { closePeriod, confirmSettlement, completePeriod, updateMemberPreferences, addMemberToPeriod } = usePeriods(groupId);
  const { expenses, loading: expensesLoading, addExpense, deleteExpense, updateExpense, totalExpenses, expensesByType } = useExpenses(periodId);
  const { notes, loading: notesLoading, addNote } = useNotes(periodId);
  
  const [allMembers, setAllMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
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

  const activeMembers = allMembers.filter(m => period?.activeMembers?.includes(m.id));

  const handleAddExpense = async (expenseData) => {
    setActionLoading(true);
    try {
      await addExpense({ ...expenseData, groupId });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <Navbar />
      <PageContainer className="animate-slide-in">
        <PageHeader 
          title={period.name}
          subtitle={group.name}
          backHref={`/group/${groupId}`}
          action={
            <div className="flex items-center gap-2">
              {period.status === 'active' && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setShowAddMemberModal(true)}
                    title="Add Member"
                  >
                    <span className="sm:hidden">👤+</span>
                    <span className="hidden sm:inline">👤+ Add Member</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setShowSettingsModal(true)}
                    title="Settings"
                  >
                    <span className="sm:hidden">⚙️</span>
                    <span className="hidden sm:inline">⚙️ Settings</span>
                  </Button>
                </div>
              )}
              <StatusBadge status={period.status} />
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {expenses.length}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Transactions</p>
            </CardContent>
          </Card>
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
            <div className="space-y-6">
              {Object.entries(
                expenses.reduce((groups, expense) => {
                  const date = expense.expenseDate?.toDate 
                    ? expense.expenseDate.toDate() 
                    : new Date(expense.expenseDate || Date.now());
                  
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(today.getDate() - 1);

                  let dateStr;
                  if (date.toDateString() === today.toDateString()) {
                    dateStr = 'Today';
                  } else if (date.toDateString() === yesterday.toDateString()) {
                    dateStr = 'Yesterday';
                  } else {
                    dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  }

                  if (!groups[dateStr]) groups[dateStr] = [];
                  groups[dateStr].push(expense);
                  return groups;
                }, {})
              ).map(([date, dateExpenses]) => (
                <div key={date} className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    {date}
                  </h4>
                  <div className="space-y-2">
                    {dateExpenses.map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        members={activeMembers}
                        onDelete={handleDeleteExpense}
                        canDelete={period.status === 'active'}
                        periodStatus={period.status}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

        {/* Floating Action Button */}
        {period.status === 'active' && (
          <div className="fixed bottom-6 right-6 safe-bottom">
            <Button
              onClick={() => setShowAddExpenseModal(true)}
              size="xl"
              className="w-14 h-14 rounded-full shadow-2xl shadow-indigo-500/40"
            >
              <span className="text-2xl">+</span>
            </Button>
          </div>
        )}

      </PageContainer>
      
      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSubmit={handleAddExpense}
        members={activeMembers}
        lastElectricityUnit={group.lastElectricityUnit || 0}
        totalRentAmount={group.totalRentAmount}
        memberPreferences={period.memberPreferences}
        onUpdateElectricity={handleUpdateElectricity}
        loading={actionLoading}
      />

      <PeriodSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        members={activeMembers}
        initialPreferences={period.memberPreferences}
        onSave={handleSaveSettings}
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
