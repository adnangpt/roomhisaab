'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useExpenses(periodId) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!periodId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'expenses'),
      where('periodId', '==', periodId),
      orderBy('expenseDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(expensesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [periodId]);

  const addExpense = async ({ type, amount, paidBy, includedMembers, expenseDate, description, groupId }) => {
    if (!user) throw new Error('Must be logged in');
    if (!periodId) throw new Error('Period ID required');

    const expenseData = {
      periodId,
      groupId,
      type,
      amount: Number(amount),
      paidBy,
      includedMembers,
      expenseDate: expenseDate || new Date(),
      description: description || '',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'expenses'), expenseData);
    return docRef.id;
  };

  const addBulkExpenses = async (expensesList) => {
    if (!user) throw new Error('Must be logged in');
    if (!periodId) throw new Error('Period ID required');

    const batch = writeBatch(db);
    const expensesRef = collection(db, 'expenses');

    expensesList.forEach(expense => {
      const newDocRef = doc(expensesRef);
      batch.set(newDocRef, {
        ...expense,
        periodId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        expenseDate: expense.expenseDate || new Date(),
      });
    });

    await batch.commit();
  };

  const deleteExpense = async (expenseId, createdBy) => {
    if (!user) throw new Error('Must be logged in');
    
    // Only creator can delete
    if (createdBy !== user.uid) {
      throw new Error('Only the expense creator can delete this expense');
    }

    await deleteDoc(doc(db, 'expenses', expenseId));
  };

  const updateExpense = async (expenseId, { type, amount, paidBy, includedMembers, expenseDate, description }) => {
    console.log('useExpenses updateExpense called:', expenseId, { type, amount, paidBy, includedMembers, expenseDate, description });
    if (!user) throw new Error('Must be logged in');
    
    const expenseRef = doc(db, 'expenses', expenseId);
    try {
      await updateDoc(expenseRef, {
        type,
        amount: Number(amount),
        paidBy,
        includedMembers,
        expenseDate: expenseDate || new Date(),
        description: description || '',
        updatedAt: serverTimestamp(),
      });
      console.log('Firestore updateDoc success');
    } catch (err) {
      console.error('Firestore updateDoc error:', err);
      throw err;
    }
  };

  // Calculate totals by type
  const expensesByType = expenses.reduce((acc, expense) => {
    const type = expense.type;
    acc[type] = (acc[type] || 0) + expense.amount;
    return acc;
  }, {});

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return {
    expenses,
    loading,
    error,
    addExpense,
    addBulkExpenses,
    deleteExpense,
    updateExpense,
    expensesByType,
    totalExpenses,
  };
}
