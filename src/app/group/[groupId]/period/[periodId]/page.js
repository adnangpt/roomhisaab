'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
        alert('Failed to delete period');
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
      <PageContainer className="animate-slide-in">
        <PageHeader 
          title={period.name}
          subtitle={group.name}
          backHref={`/group/${groupId}`}
          action={
            <div className="flex items-center gap-1 sm:gap-2">
              {period.status === 'active' && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAddMemberModal(true)}
                    className="h-9 px-2 sm:px-3 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-1"
                    title="Add Member"
                  >
                    <span className="text-lg">👤</span>
                    <span className="hidden sm:inline text-xs">Add</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowSettingsModal(true)}
                    className="h-9 px-2 sm:px-3 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-1"
                    title="Settings"
                  >
                    <span className="text-lg">⚙️</span>
                    <span className="hidden sm:inline text-xs">Settings</span>
                  </Button>
                </>
              )}
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                <span className="hidden xs:inline">{activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}</span>
                <span className="xs:hidden">{activeMembers.length} <span className="text-[10px]">👥</span></span>
              </Badge>
              <StatusBadge status={period.status} className="ml-1" />
            </div>
          }
        />


        
        {/* Primary Action Button */}
        {period.status === 'active' && (
          <div className="mb-6 flex justify-end">
            <Button 
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              <span className="mr-2">+</span>
              Add New Expense
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Total Expenses</p>
              <p className="text-[9px] text-slate-400">Incl. Rent & Electricity</p>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {(() => {
                  const balances = calculateNetBalances(expenses, period.activeMembers);
                  const externalShares = calculateExternalShares(expenses);
                  const totalLiabilities = calculateTotalLiabilities(balances, externalShares, period.activeMembers);
                  const myTotal = totalLiabilities[user?.uid] || 0;
                  return formatCurrency(Math.abs(myTotal));
                })()}
              </p>
              <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-bold">Your Share</p>
              <p className="text-[9px] text-indigo-400/80">
                {(() => {
                  const balances = calculateNetBalances(expenses, period.activeMembers);
                  const externalShares = calculateExternalShares(expenses);
                  const totalLiabilities = calculateTotalLiabilities(balances, externalShares, period.activeMembers);
                  const myTotal = totalLiabilities[user?.uid] || 0;
                  return myTotal >= 0 ? 'To receive' : 'To pay';
                })()}
              </p>
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

        {/* Payment Summary */}
        {activeMembers.length > 0 && expenses.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="font-semibold text-slate-900 dark:text-white">Payment Summary</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeMembers.map(member => {
                  const totalPaid = expenses
                    .filter(exp => exp.paidBy === member.id)
                    .reduce((sum, exp) => sum + exp.amount, 0);
                  
                  return (
                    <div key={member.id} className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{member.displayName}</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>
                  );
                })}
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
      
      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSubmit={handleAddExpense}
        members={activeMembers}
        lastElectricityUnit={period.lastElectricityUnit || group.lastElectricityUnit || 0}
        totalRentAmount={period.totalRentAmount || group.totalRentAmount}
        memberPreferences={period.memberPreferences}
        onUpdateElectricity={handleUpdateElectricity}
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
