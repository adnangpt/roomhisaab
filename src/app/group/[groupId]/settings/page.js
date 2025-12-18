'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup, useGroups } from '@/hooks/useGroups';
import { getUsersByIds } from '@/lib/auth';
import { Navbar, PageContainer, PageHeader } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/EmptyState';

export default function GroupSettingsPage({ params }) {
  const { groupId } = use(params);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { group, loading: groupLoading } = useGroup(groupId);
  const { 
    updateElectricityUnit, 
    updateTotalRentAmount, 
    checkUserBalances, 
    leaveGroup,
    deleteGroup
  } = useGroups();
  
  const [electricityUnit, setElectricityUnit] = useState(0);
  const [rentAmount, setRentAmount] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [savingRent, setSavingRent] = useState(false);
  const [savedRent, setSavedRent] = useState(false);
  
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger',
    loading: false,
    singleAction: false,
    actionText: 'Confirm'
  });
  
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (group) {
      if (group.lastElectricityUnit !== undefined) {
        setElectricityUnit(group.lastElectricityUnit);
      }
      if (group.totalRentAmount !== undefined) {
        setRentAmount(group.totalRentAmount);
      }
    }
  }, [group]);

  const handleSaveElectricity = async () => {
    setSaving(true);
    try {
      await updateElectricityUnit(groupId, parseFloat(electricityUnit) || 0);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRent = async () => {
    setSavingRent(true);
    try {
      await updateTotalRentAmount(groupId, parseFloat(rentAmount) || 0);
      setSavedRent(true);
      setTimeout(() => setSavedRent(false), 2000);
    } finally {
      setSavingRent(false);
    }
  };


  const handleLeaveGroup = async () => {
    // Check for balances first
    try {
      const { hasBalance, periodName, balance } = await checkUserBalances(groupId, user.uid);
      
      if (hasBalance) {
        setConfirmation({
          isOpen: true,
          title: 'Cannot Leave Group',
          message: `You have a pending balance of ${Math.abs(balance).toFixed(2)} in period "${periodName}". You must settle up before leaving.`,
          variant: 'danger',
          singleAction: true,
          actionText: 'Close',
          onConfirm: () => setConfirmation(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }

      setConfirmation({
        isOpen: true,
        title: 'Leave Group',
        message: 'Are you sure you want to leave this group? You will lose access to all history and expenses.',
        variant: 'danger',
        actionText: 'Leave Group',
        onConfirm: async () => {
          setConfirmation(prev => ({ ...prev, loading: true }));
          try {
            await leaveGroup(groupId);
            router.push('/dashboard');
          } catch (err) {
            console.error(err);
            setConfirmation(prev => ({ ...prev, isOpen: false }));
            alert(err.message);
          } finally {
            setConfirmation(prev => ({ ...prev, loading: false }));
          }
        }
      });
    } catch (err) {
      console.error(err);
      alert('Failed to check balances');
    }
  };

  const handleDeleteGroup = async () => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Group',
      message: 'CRITICAL: This will permanently delete this group and ALL its history, periods, and expenses. This action cannot be undone.',
      variant: 'danger',
      actionText: 'Delete Everything',
      onConfirm: async () => {
        setConfirmation(prev => ({ ...prev, loading: true }));
        try {
          await deleteGroup(groupId);
          router.push('/dashboard');
        } catch (err) {
          console.error(err);
          setConfirmation(prev => ({ ...prev, isOpen: false }));
          alert('Failed to delete group: ' + err.message);
        } finally {
          setConfirmation(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  if (authLoading || groupLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !group) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <PageContainer>
        <PageHeader 
          title="Settings"
          subtitle={group.name}
          backHref={`/group/${groupId}`}
        />

        {/* Electricity Settings */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              ⚡ Electricity Unit
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Store the last electricity meter reading for reference when adding new bills.
            </p>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Enter unit"
                value={electricityUnit}
                onChange={(e) => setElectricityUnit(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSaveElectricity} 
                loading={saving}
                variant={saved ? 'success' : 'primary'}
              >
                {saved ? '✓ Saved' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rent Settings */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              🏠 Rent Settings
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Set the fixed total rent amount for the group. This will auto-fill when adding rent expenses.
            </p>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Enter total rent amount"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSaveRent} 
                loading={savingRent}
                variant={savedRent ? 'success' : 'primary'}
              >
                {savedRent ? '✓ Saved' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Group Info */}
        <Card className='mb-6'>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Group Info
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Name</span>
              <span className="font-medium text-slate-900 dark:text-white">{group.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Members</span>
              <span className="font-medium text-slate-900 dark:text-white">{group.members?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Created</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {group.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>


        {/* Danger Zone */}
        <Card className="border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <h3 className="font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Leave Group</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Revoke your access to this group
                </p>
              </div>
              <Button 
                variant="secondary" 
                onClick={handleLeaveGroup}
              >
                Leave Group
              </Button>
            </div>

            <div className="pt-6 border-t border-red-100 dark:border-red-900/30 flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Delete Group</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Permanently delete this group and all its data
                </p>
              </div>
              <Button 
                variant="danger" 
                onClick={handleDeleteGroup}
              >
                Delete Group
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConfirmationModal
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          variant={confirmation.variant}
          confirmText={confirmation.actionText}
          loading={confirmation.loading}
          cancelText={confirmation.singleAction ? null : 'Cancel'}
        />
      </PageContainer>
    </div>
  );
}
