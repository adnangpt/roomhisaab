'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function usePeriods(groupId) {
  const { user } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setPeriods([]);
      setActivePeriod(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'periods'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const periodsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPeriods(periodsData);
        
        // Find active period
        const active = periodsData.find(p => p.status === 'active');
        setActivePeriod(active || null);
        
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching periods:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  const createPeriod = async (name, activeMembers, rentAmount = 0, rentMembers = [], startDate = new Date()) => {
    if (!user) throw new Error('Must be logged in');
    if (!groupId) throw new Error('Group ID required');

    // Initialize member preferences (default all true)
    const memberPreferences = {};
    activeMembers.forEach(memberId => {
      memberPreferences[memberId] = {
        rent: true,
        rashan: true,
        electricity: true
      };
    });

    const periodData = {
      groupId,
      name,
      startDate: startDate,
      endDate: null,
      createdAt: serverTimestamp(),
      activeMembers,
      memberPreferences,
      confirmedBy: [],
      status: 'active',
      createdBy: user.uid,
    };

    const docRef = await addDoc(collection(db, 'periods'), periodData);
    const periodId = docRef.id;

    // Automatically add Rent expense if amount > 0
    if (rentAmount > 0 && rentMembers.length > 0) {
      await addDoc(collection(db, 'expenses'), {
        periodId,
        groupId,
        type: 'rent',
        amount: Number(rentAmount),
        paidBy: '__EXTERNAL__', // Unpaid shared liability
        includedMembers: rentMembers,
        expenseDate: startDate,
        description: 'Monthly Rent (Auto-generated)',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
    }

    return periodId;
  };

  const closePeriod = async (periodId) => {
    const periodRef = doc(db, 'periods', periodId);
    await updateDoc(periodRef, {
      status: 'closed',
      endDate: new Date(),
    });
  };

  const confirmSettlement = async (periodId, userId) => {
    const periodRef = doc(db, 'periods', periodId);
    await updateDoc(periodRef, {
      confirmedBy: arrayUnion(userId),
    });
  };

  const completePeriod = async (periodId) => {
    const periodRef = doc(db, 'periods', periodId);
    await updateDoc(periodRef, {
      status: 'completed',
    });
  };

  const updateMemberPreferences = async (periodId, preferences) => {
    const periodRef = doc(db, 'periods', periodId);
    await updateDoc(periodRef, {
      memberPreferences: preferences,
    });
  };

  const addMemberToPeriod = async (periodId, memberIds, currentMembers, currentPreferences) => {
    const periodRef = doc(db, 'periods', periodId);
    
    const newMembers = [...currentMembers, ...memberIds];
    const newPreferences = { ...currentPreferences };
    
    memberIds.forEach(memberId => {
      newPreferences[memberId] = {
        rent: true,
        rashan: true,
        electricity: true
      };
    });

    await updateDoc(periodRef, {
      activeMembers: newMembers,
      memberPreferences: newPreferences
    });
  };

  return {
    periods,
    activePeriod,
    loading,
    error,
    createPeriod,
    closePeriod,
    confirmSettlement,
    completePeriod,
    updateMemberPreferences,
    addMemberToPeriod,
  };
}

export function usePeriod(periodId) {
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!periodId) {
      setPeriod(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'periods', periodId), 
      (doc) => {
        if (doc.exists()) {
          setPeriod({ id: doc.id, ...doc.data() });
        } else {
          setPeriod(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching period:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [periodId]);

  return { period, loading };
}
