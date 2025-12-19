const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addRentExpense() {
  const periodId = '7OuznrIbqmVdOcOiDlkN';
  const groupId = 'rUY0zwtpmIimI6xjDAVp';
  
  // All 3 members
  const members = [
    'q0CnnqbihrdkLFSeOSgfC8LhLmA3', // Test User Anim
    'RbavfSoriaXBljYWgFvsD03Zyam1', // Sanavar
    '4YvA01nxyoZOGN7ITpVv71ducoC2'  // John Doe
  ];
  
  const rentExpense = {
    periodId,
    groupId,
    type: 'rent',
    amount: 2650,
    paidBy: '__EXTERNAL__', // This is the key - marks it as a shared liability
    includedMembers: members,
    description: 'Rent',
    expenseDate: new Date(),
    createdBy: 'q0CnnqbihrdkLFSeOSgfC8LhLmA3',
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, 'expenses'), rentExpense);
  console.log('Rent expense added with ID:', docRef.id);
  console.log('Amount:', 2650);
  console.log('Split among:', members.length, 'members');
  console.log('Each person\'s share:', 2650 / members.length);
  
  process.exit(0);
}

addRentExpense().catch(err => {
  console.error(err);
  process.exit(1);
});
