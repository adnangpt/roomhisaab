const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
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

async function checkRentExpenses() {
  const periodId = '7OuznrIbqmVdOcOiDlkN';
  
  const q = query(
    collection(db, 'expenses'),
    where('periodId', '==', periodId)
  );
  
  const snapshot = await getDocs(q);
  
  console.log(`Found ${snapshot.size} expenses for period ${periodId}\n`);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('---');
    console.log('ID:', doc.id);
    console.log('Type:', data.type);
    console.log('Amount:', data.amount);
    console.log('PaidBy:', data.paidBy);
    console.log('IncludedMembers:', data.includedMembers);
    console.log('Description:', data.description);
    console.log('');
  });
  
  process.exit(0);
}

checkRentExpenses().catch(err => {
  console.error(err);
  process.exit(1);
});
