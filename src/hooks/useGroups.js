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
  arrayUnion,
  arrayRemove,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateNetBalances } from '@/lib/calculations';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching groups:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createGroup = async (name) => {
    if (!user) throw new Error('Must be logged in');

    const groupData = {
      name,
      createdAt: serverTimestamp(),
      lastElectricityUnit: 0,
      members: [user.uid],
      createdBy: user.uid,
    };

    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return docRef.id;
  };

  const addMember = async (groupId, memberId) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(memberId),
    });
  };

  const checkUserBalances = async (groupId, userId) => {
    // Get all active periods for this group
    const periodsRef = collection(db, 'periods');
    const q = query(
      periodsRef, 
      where('groupId', '==', groupId), 
      where('status', '==', 'active')
    );
    const periodsSnapshot = await getDocs(q);

    for (const periodDoc of periodsSnapshot.docs) {
      const periodId = periodDoc.id;
      // Get expenses for this period
      const expensesRef = collection(db, 'expenses');
      const expensesQ = query(expensesRef, where('periodId', '==', periodId));
      const expensesSnapshot = await getDocs(expensesQ);
      const expenses = expensesSnapshot.docs.map(d => d.data());

      // Calculate balance
      const balances = calculateNetBalances(expenses);
      const userBalance = balances[userId] || 0;

      if (Math.abs(userBalance) > 0.01) {
        return {
          hasBalance: true,
          periodName: periodDoc.data().name,
          balance: userBalance
        };
      }
    }
    return { hasBalance: false };
  };

  const removeMember = async (groupId, memberId) => {
    // Check for balances first
    const { hasBalance, periodName, balance } = await checkUserBalances(groupId, memberId);
    
    if (hasBalance) {
      const type = balance > 0 ? 'receives' : 'owes';
      throw new Error(`Cannot remove member. They have a pending balance of ${Math.abs(balance).toFixed(2)} in period "${periodName}". Please settle up first.`);
    }

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(memberId),
    });
  };

  const leaveGroup = async (groupId) => {
    if (!user) throw new Error('Must be logged in');
    
    // Check for balances first
    const { hasBalance, periodName, balance } = await checkUserBalances(groupId, user.uid);
    
    if (hasBalance) {
      throw new Error(`Cannot leave group. You have a pending balance of ${Math.abs(balance).toFixed(2)} in period "${periodName}". Please settle up first.`);
    }

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(user.uid),
    });
  };

  const updateElectricityUnit = async (groupId, unit) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      lastElectricityUnit: unit,
    });
  };

  const updateTotalRentAmount = async (groupId, amount) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      totalRentAmount: amount,
    });
  };

  const deleteGroup = async (groupId) => {
    if (!user) throw new Error('Must be logged in');
    
    // 1. Get all periods for this group
    const periodsRef = collection(db, 'periods');
    const periodsQ = query(periodsRef, where('groupId', '==', groupId));
    const periodsSnapshot = await getDocs(periodsQ);
    
    // 2. For each period, delete expenses and notes
    for (const periodDoc of periodsSnapshot.docs) {
      const periodId = periodDoc.id;
      
      // Delete expenses
      const expensesRef = collection(db, 'expenses');
      const expensesQ = query(expensesRef, where('periodId', '==', periodId));
      const expensesSnapshot = await getDocs(expensesQ);
      const deleteExpensesPromises = expensesSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteExpensesPromises);
      
      // Delete notes
      const notesRef = collection(db, 'notes');
      const notesQ = query(notesRef, where('periodId', '==', periodId));
      const notesSnapshot = await getDocs(notesQ);
      const deleteNotesPromises = notesSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteNotesPromises);
      
      // Delete the period itself
      await deleteDoc(periodDoc.ref);
    }
    
    // 3. Delete the group itself
    const groupRef = doc(db, 'groups', groupId);
    await deleteDoc(groupRef);
  };

  return {
    groups,
    loading,
    error,
    createGroup,
    addMember,
    removeMember,
    leaveGroup,
    checkUserBalances,
    updateElectricityUnit,
    updateTotalRentAmount,
    deleteGroup,
  };
}

export function useGroup(groupId) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'groups', groupId), 
      (doc) => {
        if (doc.exists()) {
          setGroup({ id: doc.id, ...doc.data() });
        } else {
          setGroup(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching group:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { group, loading };
}
