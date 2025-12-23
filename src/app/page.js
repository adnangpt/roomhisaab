'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm, SignupForm } from '@/components/auth/AuthForms';
import { PageLoader } from '@/components/ui/EmptyState';

export default function HomePage() {
  const { isAuthenticated, userProfile, loading, signIn, signUp, signInWithGoogle, authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('HomePage: Auth State Changed', { isAuthenticated, loading, phone: userProfile?.phone, isNew: userProfile?.isNew });
    if (!loading && isAuthenticated) {
      if (userProfile && (!userProfile.phone || userProfile.isNew)) {
        console.log('HomePage: Redirecting to /onboarding');
        router.push('/onboarding');
      } else if (userProfile) {
        console.log('HomePage: Redirecting to /dashboard');
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, userProfile, loading, router]);

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

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      // useEffect handles the redirect
    } catch (err) {
      console.error(err);
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:py-8">
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/30 mb-3 md:mb-4">
            <span className="text-2xl md:text-3xl">💰</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">
            Room Hisaab
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Split expenses with roommates. Track, settle, and stay organized.
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-4 md:mb-5 text-center">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-800">
                <strong>Important:</strong> {authError}
              </div>
            )}
            
            {isLogin ? (
              <LoginForm 
                onSubmit={handleLogin}
                onSwitchToSignup={() => setIsLogin(false)}
                onGoogleLogin={handleGoogleLogin}
                loading={authLoading}
              />
            ) : (
              <SignupForm 
                onSubmit={handleSignup}
                onSwitchToLogin={() => setIsLogin(true)}
                onGoogleLogin={handleGoogleLogin}
                loading={authLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 md:py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="mb-0.5 opacity-75 italic">Made with ❤️ for roommates everywhere</p>
        <p className="font-semibold text-slate-900 dark:text-white">
          Made by{' '}
          <a 
            href="https://www.linkedin.com/in/adnan18298/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 transition-colors"
          >
            Adnan
          </a>
        </p>
      </footer>
    </div>
  );
}
