'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useNotes(periodId) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!periodId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('periodId', '==', periodId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(notesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [periodId]);

  const addNote = async (text) => {
    if (!user) throw new Error('Must be logged in');
    if (!periodId) throw new Error('Period ID required');

    const noteData = {
      periodId,
      text,
      author: user.uid,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notes'), noteData);
    return docRef.id;
  };

  return {
    notes,
    loading,
    error,
    addNote,
  };
}
