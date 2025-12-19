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

async function setupManualDemo() {
  const rentPayerId = 'q0CnnqbihrdkLFSeOSgfC8LhLmA3'; // Test User Anim
  const rashanPayer1Id = 'RbavfSoriaXBljYWgFvsD03Zyam1'; // Sanavar
  const rashanPayer2Id = '4YvA01nxyoZOGN7ITpVv71ducoC2'; // John Doe

  const memberIds = [rentPayerId, rashanPayer1Id, rashanPayer2Id];

  // 1. Create Group
  const groupRef = await addDoc(collection(db, 'groups'), {
    name: 'room no. 7',
    members: memberIds,
    createdBy: rentPayerId,
    createdAt: serverTimestamp(),
  });
  const groupId = groupRef.id;
  console.log('Group created:', groupId);

  // 2. Create Period
  const periodRef = await addDoc(collection(db, 'periods'), {
    groupId,
    name: 'Dec 2025',
    status: 'active',
    activeMembers: memberIds,
    memberPreferences: {
      [rentPayerId]: { rashan: false, rent: true, electricity: true },
      [rashanPayer1Id]: { rashan: true, rent: true, electricity: true },
      [rashanPayer2Id]: { rashan: true, rent: true, electricity: true },
    },
    createdBy: rentPayerId,
    createdAt: serverTimestamp(),
  });
  const periodId = periodRef.id;
  console.log('Period created:', periodId);

  console.log('Setup complete!');
  console.log(`URL: http://localhost:3000/group/${groupId}/period/${periodId}`);
  process.exit(0);
}

setupManualDemo().catch(err => {
  console.error(err);
  process.exit(1);
});
