const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
  const groupId = 'sefXSKVvVYfOzN6OcTkJ'; // Test Group ID
  const userId = 'NAcXmbt4ASZDVgqkoiCZQQmU28r2'; // Test User ID
  
  console.log('--- Verifying Multiple Active Periods ---');
  const periodData = {
    groupId,
    name: 'Jan 2026 (Test)',
    startDate: new Date(),
    endDate: null,
    createdAt: serverTimestamp(),
    activeMembers: [userId],
    memberPreferences: {
      [userId]: { rent: true, rashan: true, electricity: true }
    },
    confirmedBy: [],
    status: 'active',
    createdBy: userId,
  };

  try {
    const docRef = await addDoc(collection(db, 'periods'), periodData);
    console.log('Created second active period:', docRef.id);
    
    const q = query(collection(db, 'periods'), where('groupId', '==', groupId), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} active periods (Expected > 1)`);

    console.log('\n--- Verifying Midway Member Addition ---');
    const newMemberId = 'dummy_member_id';
    const periodRef = doc(db, 'periods', docRef.id);
    const periodSnap = await getDoc(periodRef);
    const currentMembers = periodSnap.data().activeMembers;
    const currentPrefs = periodSnap.data().memberPreferences;

    const newMembers = [...currentMembers, newMemberId];
    const newPreferences = {
      ...currentPrefs,
      [newMemberId]: { rent: true, rashan: true, electricity: true }
    };

    await updateDoc(periodRef, {
      activeMembers: newMembers,
      memberPreferences: newPreferences
    });
    
    const updatedSnap = await getDoc(periodRef);
    console.log('Updated members:', updatedSnap.data().activeMembers);
    console.log('Updated preferences for new member:', updatedSnap.data().memberPreferences[newMemberId]);

    console.log('\n--- Verifying Expense Editing ---');
    const expenseData = {
      periodId: docRef.id,
      groupId,
      type: 'rashan',
      amount: 100,
      paidBy: userId,
      includedMembers: [userId],
      expenseDate: new Date(),
      description: 'Initial',
      createdBy: userId,
      createdAt: serverTimestamp(),
    };
    const expRef = await addDoc(collection(db, 'expenses'), expenseData);
    console.log('Created expense:', expRef.id);

    await updateDoc(expRef, {
      amount: 200,
      description: 'Updated',
      updatedAt: serverTimestamp(),
    });
    const expSnap = await getDoc(expRef);
    console.log('Updated expense amount:', expSnap.data().amount);
    console.log('Updated expense description:', expSnap.data().description);

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit();
}

verify();
