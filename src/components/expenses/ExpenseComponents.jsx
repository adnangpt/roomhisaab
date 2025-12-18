'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, getExpenseTypeIcon, getExpenseTypeLabel } from '@/lib/calculations';
import { useAuth } from '@/contexts/AuthContext';

export function ExpenseCard({ expense, members, onDelete, canDelete, periodStatus }) {
  const { user } = useAuth();
  const isCreator = expense.createdBy === user?.uid;
  const canDeleteExpense = canDelete && isCreator && periodStatus === 'active';
  const canEditExpense = canDelete && isCreator && periodStatus === 'active';
  
  const payer = members.find(m => m.id === expense.paidBy);
  const typeIcons = {
    rent: '🏠',
    rashan: '🛒',
    electricity: '⚡',
    other: '💸'
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
          {typeIcons[expense.type] || '💸'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-white truncate text-sm">
              {expense.type === 'rent' ? 'Rent' : expense.type === 'electricity' ? 'Electricity' : expense.description || 'Expense'}
            </h4>
            <span className="font-bold text-slate-900 dark:text-white text-sm shrink-0">
              {formatCurrency(expense.amount)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {expense.paidBy === '__EXTERNAL__' ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">External</span>
              ) : (
                `By ${payer?.displayName?.split(' ')[0] || 'Unknown'}`
              )}
            </p>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Split: {expense.includedMembers?.length || 0} {expense.includedMembers?.length === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>

        {/* Actions */}
        {canDelete && (
          <div className="flex items-center gap-1 ml-2">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onDelete(expense.id, expense.createdBy, 'edit')}
              className="text-slate-400 hover:text-indigo-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onDelete(expense.id, expense.createdBy, 'delete')}
              className="text-slate-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  members, 
  lastElectricityUnit,
  totalRentAmount,
  memberPreferences,
  onUpdateElectricity,
  loading 
}) {
  const { user } = useAuth();
  const [type, setType] = useState('rashan');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [includedMembers, setIncludedMembers] = useState([]);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [electricityUnit, setElectricityUnit] = useState(lastElectricityUnit || 0);
  const [error, setError] = useState('');

  // Initialize defaults when modal opens or type changes
  useEffect(() => {
    if (isOpen && members.length > 0) {
      // Set default payer if not set
      if (!paidBy && user) {
        setPaidBy(user.uid);
      }

      // Filter members based on preferences for the selected type
      const relevantMembers = members
        .filter(m => {
          // If no preferences set, include everyone (backward compatibility)
          if (!memberPreferences || !memberPreferences[m.id]) return true;
          // Check specific preference
          return memberPreferences[m.id][type] !== false;
        })
        .map(m => m.id);
      
      setIncludedMembers(relevantMembers);

      // Auto-fill rent amount
      if (type === 'rent' && totalRentAmount) {
        setAmount(totalRentAmount.toString());
      } else if (type !== 'rent' && amount === totalRentAmount?.toString()) {
        // Clear amount if switching away from rent and it was the auto-filled value
        setAmount('');
      }
    }
  }, [isOpen, type, members, memberPreferences, totalRentAmount, user]);

  useEffect(() => {
    setElectricityUnit(lastElectricityUnit || 0);
  }, [lastElectricityUnit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!paidBy) {
      setError('Please select who paid');
      return;
    }
    
    if (includedMembers.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    const selectedDate = new Date(expenseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow today

    if (selectedDate > today) {
      setError('Future dates are not allowed');
      return;
    }
    
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        paidBy,
        includedMembers,
        description,
        expenseDate: new Date(expenseDate),
      });
      
      // Update electricity unit if changed
      if (type === 'electricity' && electricityUnit !== lastElectricityUnit) {
        await onUpdateElectricity(electricityUnit);
      }
      
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add expense');
    }
  };

  const resetForm = () => {
    setType('rashan');
    setAmount('');
    setDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setError('');
  };

  const toggleMember = (memberId) => {
    setIncludedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const expenseTypes = [
    { value: 'rent', label: '🏠 Rent' },
    { value: 'rashan', label: '🛒 Rashan' },
    { value: 'electricity', label: '⚡ Electricity' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Expense" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Expense Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Type
          </label>
          <div className="flex gap-2">
            {expenseTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  type === t.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Electricity Unit (only for electricity type) */}
        {type === 'electricity' && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Last Electricity Unit: {lastElectricityUnit || 0}
              </span>
            </div>
            <Input
              label="Current Unit Reading"
              type="number"
              placeholder="Enter current unit"
              value={electricityUnit}
              onChange={(e) => setElectricityUnit(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {/* Amount */}
        <Input
          label="Amount (₹)"
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        {/* Paid By */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Paid By
          </label>
          <div className="grid grid-cols-2 gap-2">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setPaidBy(member.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  paidBy === member.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <p className="font-medium text-sm">{member.displayName}</p>
              </button>
            ))}
            {(type === 'rent' || type === 'electricity') && (
              <button
                type="button"
                onClick={() => setPaidBy('__EXTERNAL__')}
                className={`p-3 rounded-xl text-left transition-all border-2 ${
                  paidBy === '__EXTERNAL__'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/25'
                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                }`}
              >
                <p className="font-bold text-sm">Not paid yet</p>
                <p className="text-[10px] opacity-80">Shared Liability</p>
              </button>
            )}
          </div>
        </div>

        {/* Split With */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Split With
          </label>
          <div className="grid grid-cols-2 gap-2">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                  includedMembers.includes(member.id)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includedMembers.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-medium text-sm text-slate-900 dark:text-white">
                  {member.displayName}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <Textarea
          label="Description (Optional)"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
        
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function EditExpenseModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  members, 
  expense,
  loading 
}) {
  const [type, setType] = useState(expense?.type || 'rashan');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || '');
  const [includedMembers, setIncludedMembers] = useState(expense?.includedMembers || []);
  const [description, setDescription] = useState(expense?.description || '');
  const [expenseDate, setExpenseDate] = useState(
    expense?.expenseDate 
      ? (expense.expenseDate.toDate ? expense.expenseDate.toDate() : new Date(expense.expenseDate)).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && expense) {
      setType(expense.type);
      setAmount(expense.amount.toString());
      setPaidBy(expense.paidBy);
      setIncludedMembers(expense.includedMembers);
      setDescription(expense.description || '');
      const date = expense.expenseDate.toDate ? expense.expenseDate.toDate() : new Date(expense.expenseDate);
      setExpenseDate(date.toISOString().split('T')[0]);
    }
  }, [isOpen, expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!paidBy) {
      setError('Please select who paid');
      return;
    }
    
    if (includedMembers.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    const selectedDate = new Date(expenseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      setError('Future dates are not allowed');
      return;
    }
    
    try {
      await onSubmit(expense.id, {
        type,
        amount: parseFloat(amount),
        paidBy,
        includedMembers,
        description,
        expenseDate: new Date(expenseDate),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update expense');
    }
  };

  const toggleMember = (memberId) => {
    setIncludedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const expenseTypes = [
    { value: 'rent', label: '🏠 Rent' },
    { value: 'rashan', label: '🛒 Rashan' },
    { value: 'electricity', label: '⚡ Electricity' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Expense" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Type
          </label>
          <div className="flex gap-2">
            {expenseTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  type === t.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Amount (₹)"
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Paid By
          </label>
          <div className="grid grid-cols-2 gap-2">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setPaidBy(member.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  paidBy === member.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <p className="font-medium text-sm">{member.displayName}</p>
              </button>
            ))}
            {(type === 'rent' || type === 'electricity') && (
              <button
                type="button"
                onClick={() => setPaidBy('__EXTERNAL__')}
                className={`p-3 rounded-xl text-left transition-all border-2 ${
                  paidBy === '__EXTERNAL__'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/25'
                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                }`}
              >
                <p className="font-bold text-sm">Not paid yet</p>
                <p className="text-[10px] opacity-80">Shared Liability</p>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Split With
          </label>
          <div className="grid grid-cols-2 gap-2">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                  includedMembers.includes(member.id)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includedMembers.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-medium text-sm text-slate-900 dark:text-white">
                  {member.displayName}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Textarea
          label="Description (Optional)"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <Input
          label="Date"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
        
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Update Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
