'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import { Navbar, PageContainer, PageHeader } from '@/components/layout/Layout';
import { GroupCard, CreateGroupModal } from '@/components/groups/GroupComponents';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageLoader } from '@/components/ui/EmptyState';
import { GroupSkeleton, StatsSkeleton } from '@/components/ui/Skeleton';
import { UserStats } from '@/components/dashboard/UserStats';

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { groups, loading: groupsLoading, createGroup } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleCreateGroup = async (name) => {
    setCreateLoading(true);
    try {
      await createGroup(name);
    } finally {
      setCreateLoading(false);
    }
  };

  if (authLoading || groupsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <PageContainer>
          <PageHeader 
            title="Your Groups" 
            subtitle="Manage expenses with your roommates"
            action={
              <Button disabled size="sm">
                + New Group
              </Button>
            }
          />
          
          {/* Stats Dashboard */}
          <UserStats />

          <div className="space-y-3">
            <GroupSkeleton />
            <GroupSkeleton />
            <GroupSkeleton />
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <PageContainer>
        <PageHeader 
          title="Your Groups" 
          subtitle="Manage expenses with your roommates"
          action={
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              + New Group
            </Button>
          }
        />

        {/* Stats Dashboard */}
        <UserStats />

        {groups.length === 0 ? (
          <EmptyState
            icon="🏠"
            title="No groups yet"
            description="Create your first group to start tracking shared expenses with your roommates."
            action={
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Group
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}

        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGroup}
          loading={createLoading}
        />
      </PageContainer>
    </div>
  );
}
