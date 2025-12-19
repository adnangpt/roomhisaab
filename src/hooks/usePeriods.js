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
  arrayUnion,
  getDocs,
  writeBatch
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

  const updateMemberPreferences = async (periodId, { preferences, rentAmount, electricityAmount, electricityUnit }) => {
    const periodRef = doc(db, 'periods', periodId);
    const updateData = {
      memberPreferences: preferences,
    };
    
    // Batch for all updates
    const batch = writeBatch(db);
    
    // Update period document
    // We can't batch updateDoc for the periodRef directly if we want to use the batch object for everything
    // But updateDoc is fine to run separately or we can use batch.update(periodRef, updateData)
    // Let's use batch for everything to be safe and atomic
    
    if (rentAmount !== null && rentAmount !== undefined) {
      updateData.totalRentAmount = rentAmount;
      
      // Update existing rent expenses
      const rentQuery = query(
        collection(db, 'expenses'),
        where('periodId', '==', periodId),
        where('type', '==', 'rent'),
        where('paidBy', '==', '__EXTERNAL__')
      );
      const rentSnapshot = await getDocs(rentQuery);
      
      rentSnapshot.forEach(doc => {
        batch.update(doc.ref, { amount: rentAmount });
      });
    }

    if (electricityAmount !== null && electricityAmount !== undefined) {
      // Update existing electricity expenses
      const electricityQuery = query(
        collection(db, 'expenses'),
        where('periodId', '==', periodId),
        where('type', '==', 'electricity'),
        where('paidBy', '==', '__EXTERNAL__')
      );
      const electricitySnapshot = await getDocs(electricityQuery);
      
      if (!electricitySnapshot.empty) {
        electricitySnapshot.forEach(doc => {
          batch.update(doc.ref, { amount: electricityAmount });
        });
      } else if (electricityAmount > 0) {
        // Create new electricity expense if it doesn't exist and amount > 0
        // Find members who have electricity enabled
        const electricityMembers = Object.entries(preferences)
          .filter(([_, prefs]) => prefs.electricity)
          .map(([memberId]) => memberId);

        if (electricityMembers.length > 0) {
          const newExpenseRef = doc(collection(db, 'expenses'));
          batch.set(newExpenseRef, {
            periodId,
            groupId, // We need groupId here. It should be available in the scope or passed. 
            // Wait, groupId is available from usePeriods closure? Yes.
            type: 'electricity',
            amount: Number(electricityAmount),
            paidBy: '__EXTERNAL__',
            includedMembers: electricityMembers,
            expenseDate: new Date(), // Or period start date? Using current date for now.
            description: 'Electricity Bill (Auto-generated)',
            createdBy: user.uid,
            createdAt: serverTimestamp(),
          });
        }
      }
    }
    
    if (electricityUnit !== null && electricityUnit !== undefined) {
      updateData.lastElectricityUnit = electricityUnit;
    }
    
    batch.update(periodRef, updateData);
    
    await batch.commit();
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

    await syncRentSplit(periodId, newMembers);
  };

  const syncRentSplit = async (periodId, members) => {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('periodId', '==', periodId), where('type', '==', 'rent'));
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map(expenseDoc => 
      updateDoc(expenseDoc.ref, {
        includedMembers: members
      })
    );
    
    await Promise.all(updatePromises);
  };

  const removeMemberFromPeriod = async (periodId, memberId, currentMembers, currentPreferences) => {
    const periodRef = doc(db, 'periods', periodId);
    
    const newMembers = currentMembers.filter(id => id !== memberId);
    const newPreferences = { ...currentPreferences };
    delete newPreferences[memberId];

    await updateDoc(periodRef, {
      activeMembers: newMembers,
      memberPreferences: newPreferences
    });

    await syncRentSplit(periodId, newMembers);
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
    removeMemberFromPeriod,
    syncRentSplit,
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
