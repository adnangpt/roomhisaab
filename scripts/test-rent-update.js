const { initializeApp } = require('firebase/app');
const { getFirestore, doc, collection, query, where, getDocs, updateDoc, writeBatch } = require('firebase/firestore');
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

async function testRentUpdate() {
  const periodId = '7OuznrIbqmVdOcOiDlkN';
  const newRentAmount = 3000; // Change from 2650 to 3000

 console.log('Testing rent amount update...\n');
  
  // 1. Check current rent expense
  console.log('1. Current rent expenses:');
  const rentQuery = query(
    collection(db, 'expenses'),
    where('periodId', '==', periodId),
    where('type', '==', 'rent'),
    where('paidBy', '==', '__EXTERNAL__')
  );
  const before = await getDocs(rentQuery);
  before.forEach(doc => {
    console.log(`   ID: ${doc.id}, Amount: ₹${doc.data().amount}`);
  });
  
  // 2. Update period settings (simulate what happens when user saves)
  console.log('\n2. Updating rent amount to ₹3,000...');
  const periodRef = doc(db, 'periods', periodId);
  await updateDoc(periodRef, { totalRentAmount: newRentAmount });
  
  // Update existing rent expenses
  const batch = writeBatch(db);
  before.forEach(doc => {
    batch.update(doc.ref, { amount: newRentAmount });
  });
  if (!before.empty) {
    await batch.commit();
  }
  
  // 3. Verify update
  console.log('\n3. After update:');
  const after = await getDocs(rentQuery);
  after.forEach(doc => {
    console.log(`   ID: ${doc.id}, Amount: ₹${doc.data().amount}`);
  });
  
  console.log('\n✅ Test complete! Rent expenses updated successfully.');
  console.log(`   Each person's new share: ₹${newRentAmount / 3}`);
  
  process.exit(0);
}

testRentUpdate().catch(err => {
  console.error(err);
  process.exit(1);
});
