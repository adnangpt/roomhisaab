'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export function GroupCard({ group }) {
  const router = useRouter();
  
  return (
    <Card 
      hoverable 
      onClick={() => router.push(`/group/${group.id}`)}
      className="overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/25">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {group.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {group.members?.length || 0} members
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Card>
  );
}

export function CreateGroupModal({ isOpen, onClose, onSubmit, loading }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    try {
      await onSubmit(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Group Name"
          placeholder="e.g., Flat 69, Office Team"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
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
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AddMemberModal({ isOpen, onClose, onSubmit, loading }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }
    
    try {
      const result = await onSubmit(phone.trim());
      setSuccess(`${result.displayName} added successfully!`);
      setPhone('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add member');
    }
  };

  const handleClose = () => {
    setPhone('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Member">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter registered phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Enter the phone number of a registered user
          </p>
        </div>
        
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm">
            {success}
          </div>
        )}
        
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
