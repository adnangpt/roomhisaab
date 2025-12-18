'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export function Navbar() {
  const { userProfile, signOut } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/room-hisaab.png" alt="Room Hisaab Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Room Hisaab
            </span>
          </Link>
          
          {userProfile && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {userProfile.displayName}
                </p>
                <p className="text-xs text-slate-500">
                  {userProfile.phone}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Sign out"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleSignOut}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        variant="danger"
      />
    </>
  );
}

export function PageContainer({ children, className = '' }) {
  return (
    <main className={`max-w-3xl mx-auto px-4 py-6 ${className}`}>
      {children}
    </main>
  );
}

export function PageHeader({ title, subtitle, backHref, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mt-1 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate pr-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
