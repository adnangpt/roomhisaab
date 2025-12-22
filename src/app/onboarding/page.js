'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageLoader } from '@/components/ui/EmptyState';

export default function OnboardingPage() {
  const { user, userProfile, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(user?.displayName || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user?.displayName && !name) {
      setName(user.displayName);
    }
  }, [user, name]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (userProfile?.phone) {
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    if (normalizedPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setSubmitting(true);
    try {
      // Update Firebase Profile
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, { displayName: name });

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      const userData = {
        phone: normalizedPhone,
        displayName: name,
        email: user.email,
        updatedAt: new Date(),
      };

      if (userDoc.exists()) {
        await updateDoc(userRef, userData);
      } else {
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date(),
        });
      }
      
      // Force a small delay to ensure Firestore updates before redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/30">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-3xl mb-4">
            📱
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Finish setting up your profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            We need your phone number to help you split expenses with roommates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
}
