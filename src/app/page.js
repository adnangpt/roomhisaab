'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm, SignupForm } from '@/components/auth/AuthForms';
import { PageLoader } from '@/components/ui/EmptyState';

export default function HomePage() {
  const { isAuthenticated, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const handleLogin = async (phone, password) => {
    setAuthLoading(true);
    try {
      await signIn(phone, password);
      router.push('/dashboard');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (phone, password, displayName) => {
    setAuthLoading(true);
    try {
      await signUp(phone, password, displayName);
      router.push('/dashboard');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/30">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/30 mb-6">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Room Hisaab
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-sm">
            Split expenses with roommates. Track, settle, and stay organized.
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            
            {isLogin ? (
              <LoginForm 
                onSubmit={handleLogin}
                onSwitchToSignup={() => setIsLogin(false)}
                loading={authLoading}
              />
            ) : (
              <SignupForm 
                onSubmit={handleSignup}
                onSwitchToLogin={() => setIsLogin(true)}
                loading={authLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="mb-2">Made with ❤️ for roommates everywhere</p>
        <a 
          href="https://www.linkedin.com/in/adnan18298/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Made by Adnan
        </a>
      </footer>
    </div>
  );
}
