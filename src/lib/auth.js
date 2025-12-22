import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  collection, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Convert phone to email format for Firebase Auth (using phone as unique identifier)
const phoneToEmail = (phone) => `${phone.replace(/[^0-9]/g, '')}@roomhisaab.app`;

// Sign up with phone number + password
export async function signUp(phone, password, displayName) {
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  
  // Check if phone already exists
  const existingUser = await getUserByPhone(normalizedPhone);
  if (existingUser) {
    throw new Error('Phone number already registered');
  }

  // Create auth user with phone-based email
  const email = phoneToEmail(normalizedPhone);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    phone: normalizedPhone,
    displayName,
    createdAt: serverTimestamp(),
  });

  return user;
}

// Sign in with phone number + password
export async function signIn(phone, password) {
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  const email = phoneToEmail(normalizedPhone);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Sign in with Google - Using Popup
export async function signInWithGoogle() {
  console.log('auth.js: Starting Google sign-in...');
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('auth.js: Google sign-in successful!', result.user.email);
    return result.user;
  } catch (error) {
    console.error('auth.js: Google sign-in error:', error.code, error.message);
    throw error;
  }
}

// Sign out
export async function signOut() {
  return firebaseSignOut(auth);
}

// Get user by phone number
export async function getUserByPhone(phone) {
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

// Get user by ID
export async function getUserById(userId) {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return { id: docSnap.id, ...docSnap.data() };
}

// Get multiple users by IDs
export async function getUsersByIds(userIds) {
  if (!userIds || userIds.length === 0) return [];
  
  const users = await Promise.all(userIds.map(id => getUserById(id)));
  return users.filter(Boolean);
}
