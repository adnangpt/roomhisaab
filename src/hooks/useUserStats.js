import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalShare: 0,
    netBalance: 0,
    expenseCount: 0,
    loading: true
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // 1. Get all periods where user is a member
        const periodsQuery = query(
          collection(db, 'periods'),
          where('activeMembers', 'array-contains', user.uid)
        );
        const periodsSnapshot = await getDocs(periodsQuery);
        const activePeriodIds = new Set();
        const allPeriodIds = new Set();
        
        periodsSnapshot.docs.forEach(doc => {
          allPeriodIds.add(doc.id);
          if (doc.data().status === 'active') {
            activePeriodIds.add(doc.id);
          }
        });

        // 2. Get all expenses paid by user
        const paidQuery = query(
          collection(db, 'expenses'),
          where('paidBy', '==', user.uid)
        );
        
        // 3. Get all expenses where user is included
        const includedQuery = query(
          collection(db, 'expenses'),
          where('includedMembers', 'array-contains', user.uid)
        );

        const [paidSnapshot, includedSnapshot] = await Promise.all([
          getDocs(paidQuery),
          getDocs(includedQuery)
        ]);

        const allExpenses = new Map();
        
        paidSnapshot.docs.forEach(doc => {
          allExpenses.set(doc.id, doc.data());
        });
        
        includedSnapshot.docs.forEach(doc => {
          allExpenses.set(doc.id, doc.data());
        });

        let totalPaid = 0;
        let totalShare = 0;
        let netBalance = 0;
        let expenseCount = 0;

        allExpenses.forEach(expense => {
          // Only consider expenses from periods the user is part of
          if (!allPeriodIds.has(expense.periodId)) return;

          const isMyExpense = expense.paidBy === user.uid;
          const amIncluded = expense.includedMembers && expense.includedMembers.includes(user.uid);

          // Lifetime Stats (All periods)
          if (isMyExpense) {
            totalPaid += expense.amount;
            expenseCount++;
          }
          if (amIncluded) {
            const share = expense.amount / expense.includedMembers.length;
            totalShare += share;
          }

          // Current Balance (Active periods only)
          if (activePeriodIds.has(expense.periodId)) {
            if (isMyExpense) {
              netBalance += expense.amount;
            }
            if (amIncluded) {
              const share = expense.amount / expense.includedMembers.length;
              netBalance -= share;
            }
          }
        });

        setStats({
          totalPaid,
          totalShare,
          netBalance,
          expenseCount,
          loading: false
        });

      } catch (error) {
        console.error("Error fetching user stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]);

  return stats;
}
