'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGroup, useGroups } from '@/hooks/useGroups';
import { usePeriods } from '@/hooks/usePeriods';
import { getUsersByIds, getUserByPhone } from '@/lib/auth';
import { Navbar, PageContainer, PageHeader } from '@/components/layout/Layout';
import { AddMemberModal } from '@/components/groups/GroupComponents';
import { PeriodCard, CreatePeriodModal } from '@/components/periods/PeriodComponents';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';

import { EmptyState, PageLoader } from '@/components/ui/EmptyState';
import { PeriodSkeleton, MemberSkeleton } from '@/components/ui/Skeleton';

export default function GroupPage({ params }) {
  const { groupId } = use(params);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { showNotification } = useNotification();
  const { group, loading: groupLoading } = useGroup(groupId);
  const { addMember, removeMember, checkUserBalances, leaveGroup } = useGroups();
  const { periods, activePeriod, loading: periodsLoading, createPeriod } = usePeriods(groupId);
  
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger',
    loading: false,
    singleAction: false, // For error/info modals
    actionText: 'Confirm'
  });
  
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
          setMembers(memberData);
        } catch (error) {
          console.error('Error fetching members:', error);
        } finally {
          setMembersLoading(false);
        }
      }
    };
    fetchMembers();
  }, [group?.members]);

  const handleAddMember = async (phone) => {
    setActionLoading(true);
    try {
      const foundUser = await getUserByPhone(phone);
      if (!foundUser) {
        throw new Error('User not found. They must register first.');
      }
      if (group.members.includes(foundUser.id)) {
        throw new Error('User is already a member of this group.');
      }
      await addMember(groupId, foundUser.id);
      return foundUser;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (memberId === user?.uid) return;

    setActionLoading(true);
    try {
      // Check for balances first
      const { hasBalance, periodName, balance } = await checkUserBalances(groupId, memberId);
      
      if (hasBalance) {
        setConfirmation({
          isOpen: true,
          title: 'Cannot Remove Member',
          message: `This member has a pending balance of ${Math.abs(balance).toFixed(2)} in period "${periodName}". They must settle up before being removed.`,
          variant: 'danger',
          singleAction: true,
          actionText: 'Close',
          onConfirm: () => setConfirmation(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }

      // If no balance, ask for confirmation
      setConfirmation({
        isOpen: true,
        title: 'Remove Member',
        message: 'Are you sure you want to remove this member? They will be removed from the group.',
        variant: 'danger',
        actionText: 'Remove',
        onConfirm: async () => {
          setConfirmation(prev => ({ ...prev, loading: true }));
          try {
            await removeMember(groupId, memberId);
            setConfirmation(prev => ({ ...prev, isOpen: false }));
          } catch (err) {
            console.error(err);
            // Show error in modal if needed, or just close
            setConfirmation(prev => ({ ...prev, isOpen: false }));
            showNotification(err.message, 'error');
          } finally {
            setConfirmation(prev => ({ ...prev, loading: false }));
          }
        }
      });
    } catch (err) {
      console.error(err);
      showNotification('Failed to check member balances', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    setActionLoading(true);
    try {
      // Check for balances first
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
            showNotification(err.message, 'error');
          } finally {
            setConfirmation(prev => ({ ...prev, loading: false }));
          }
        }
      });
    } catch (err) {
      console.error(err);
      showNotification('Failed to check balances', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePeriod = async (name, activeMembers) => {
    setActionLoading(true);
    try {
      // Pass rent info for auto-creation
      const rentAmount = group.totalRentAmount || 0;
      await createPeriod(name, activeMembers, rentAmount, activeMembers);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || groupLoading || periodsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <PageContainer>
          <div className="mb-6 animate-pulse">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          
          {/* Active Period Skeleton */}
          <div className="mb-3 h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>

          {/* Members Skeleton */}
          <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
             <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded mb-4 animate-pulse"></div>
             <div className="flex flex-wrap gap-2">
               <MemberSkeleton />
               <MemberSkeleton />
               <MemberSkeleton />
             </div>
          </div>

          {/* Periods Skeleton */}
          <div className="space-y-3">
            <PeriodSkeleton />
            <PeriodSkeleton />
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!isAuthenticated || !group) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <PageContainer>
        <PageHeader 
          title={group.name}
          subtitle={`${members.length} members`}
          backHref="/dashboard"
          action={
            <Button 
              onClick={() => router.push(`/group/${groupId}/settings`)} 
              variant="ghost" 
              size="sm"
            >
              ⚙️
            </Button>
          }
        />

        {/* Active Periods Banner */}
        {periods.filter(p => p.status === 'active').map(ap => (
          <Card 
            key={ap.id}
            className="mb-3 bg-gradient-to-r from-emerald-500 to-teal-500 border-0 cursor-pointer"
            onClick={() => router.push(`/group/${groupId}/period/${ap.id}`)}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🟢</span>
                    <span className="font-semibold">Active Period</span>
                  </div>
                  <p className="text-emerald-100">{ap.name}</p>
                </div>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Members Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Members
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowAddMemberModal(true)}>
                + Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="text-center py-4 text-slate-500">Loading...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {member.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {member.displayName}
                        {member.id === user?.uid && <span className="text-slate-400 ml-1">(You)</span>}
                      </p>
                    </div>
                    {member.id !== user?.uid && (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="ml-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Periods Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Periods
            </h3>
            <Button size="sm" onClick={() => setShowCreatePeriodModal(true)}>
              + New Period
            </Button>
          </div>

          {periods.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No periods yet"
              description="Create a period to start tracking expenses. A period represents a billing cycle."
              action={
                <Button onClick={() => setShowCreatePeriodModal(true)}>
                  Create First Period
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {periods.map((period) => (
                <PeriodCard key={period.id} period={period} groupId={groupId} />
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <Card className="mb-6 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <h3 className="font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">Leave Group</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Revoke your access to this group
                </p>
              </div>
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleLeaveGroup}
              >
                Leave Group
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSubmit={handleAddMember}
          loading={actionLoading}
        />

        <CreatePeriodModal
          isOpen={showCreatePeriodModal}
          onClose={() => setShowCreatePeriodModal(false)}
          onSubmit={handleCreatePeriod}
          members={members}
          loading={actionLoading}
        />

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
