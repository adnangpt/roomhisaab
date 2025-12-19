'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';

export function PeriodCard({ period, groupId }) {
  const router = useRouter();
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <Card 
      hoverable 
      onClick={() => router.push(`/group/${groupId}/period/${period.id}`)}
      className="overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {period.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(period.startDate)}
              {period.endDate && ` - ${formatDate(period.endDate)}`}
            </p>
          </div>
          <StatusBadge status={period.status} />
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {period.activeMembers?.length || 0} members
          </span>
        </div>
      </div>
    </Card>
  );
}

export function CreatePeriodModal({ isOpen, onClose, onSubmit, members, loading }) {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter a period name');
      return;
    }
    
    if (selectedMembers.length === 0) {
      setError('Please select at least one active member');
      return;
    }
    
    try {
      await onSubmit(name.trim(), selectedMembers);
      setName('');
      setSelectedMembers([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create period');
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    setSelectedMembers(members.map(m => m.id));
  };

  const handleClose = () => {
    setName('');
    setSelectedMembers([]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Period">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Period Name"
          placeholder="e.g., December Expenses, Jan-Feb Hisaab"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Active Members
            </label>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Select All
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMembers.includes(member.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {member.displayName}
                  </p>
                  <p className="text-sm text-slate-500">{member.phone}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        
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
            Create Period
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function PeriodSettingsModal({ 
  isOpen, 
  onClose, 
  members, 
  initialPreferences,
  initialRentAmount,
  initialElectricityAmount,
  initialElectricityUnit,
  onSave, 
  loading 
}) {
  const [preferences, setPreferences] = useState(initialPreferences || {});
  const [rentAmount, setRentAmount] = useState(initialRentAmount || '');
  const [electricityAmount, setElectricityAmount] = useState(initialElectricityAmount || '');
  const [electricityUnit, setElectricityUnit] = useState(initialElectricityUnit || '');
  const [error, setError] = useState('');

  // Initialize if empty
  if (Object.keys(preferences).length === 0 && members.length > 0) {
    const initial = {};
    members.forEach(m => {
      initial[m.id] = { rent: true, rashan: true, electricity: true };
    });
    setPreferences(initial);
  }

  const handleToggle = (memberId, type) => {
    setPreferences(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [type]: !prev[memberId]?.[type]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({
        preferences,
        rentAmount: rentAmount ? parseFloat(rentAmount) : null,
        electricityAmount: electricityAmount ? parseFloat(electricityAmount) : null,
        electricityUnit: electricityUnit === '' ? 0 : (typeof electricityUnit === 'number' ? electricityUnit : parseFloat(electricityUnit) || 0)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Period Settings" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rent & Electricity Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-white">Period Amounts</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total Rent (₹)
              </label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder="e.g., 2650"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Electricity Bill (₹)
              </label>
              <input
                type="number"
                value={electricityAmount}
                onChange={(e) => setElectricityAmount(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Last Electricity Unit
              </label>
              <input
                type="number"
                value={electricityUnit}
                onChange={(e) => setElectricityUnit(e.target.value)}
                placeholder="e.g., 1500"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Member Preferences */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-white">Member Preferences</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure which expenses each member shares. Uncheck items they don't contribute to.
          </p>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            {members.map(member => (
              <div key={member.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-medium text-slate-900 dark:text-white mb-3">
                  {member.displayName}
                </h5>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[member.id]?.rent ?? true}
                      onChange={() => handleToggle(member.id, 'rent')}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">🏠 Rent</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[member.id]?.rashan ?? true}
                      onChange={() => handleToggle(member.id, 'rashan')}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">🛒 Rashan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[member.id]?.electricity ?? true}
                      onChange={() => handleToggle(member.id, 'electricity')}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">⚡ Electricity</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AddMemberToPeriodModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  groupMembers, 
  activeMemberIds,
  loading 
}) {
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [error, setError] = useState('');

  const availableMembers = groupMembers.filter(m => !activeMemberIds.includes(m.id));

  const toggleMember = (memberId) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedMemberIds.length === 0) {
      setError('Please select at least one member to add');
      return;
    }

    try {
      await onAdd(selectedMemberIds);
      setSelectedMemberIds([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add members');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Members to Period">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select group members to add to this period. They will be able to share expenses from now on.
        </p>

        {availableMembers.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
            <p className="text-sm text-slate-500">All group members are already in this period.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableMembers.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMemberIds.includes(member.id)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  name="member"
                  value={member.id}
                  checked={selectedMemberIds.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {member.displayName}
                  </p>
                  <p className="text-sm text-slate-500">{member.phone}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {error && (
          <p className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1" 
            loading={loading}
            disabled={availableMembers.length === 0}
          >
            Add Selected ({selectedMemberIds.length})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
