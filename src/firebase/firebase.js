import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,  // Import with alias
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { getDatabase, ref, query as rtdbQuery, orderByChild, equalTo, get, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: "https://ankurit-8fc54-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

// Authentication functions
const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await setDoc(doc(db, "users", userCredential.user.uid), {
      displayName,
      email,
      createdAt: new Date(),
      profilePhotoUrl: "",
      coverPhotoUrl: "",
      name: displayName
    });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userRef = doc(db, "users", result.user.uid);
    
    if (!(await getDoc(userRef)).exists()) {
      await setDoc(userRef, {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        profilePhotoUrl: result.user.photoURL || "",
        coverPhotoUrl: "",
        name: result.user.displayName,
        createdAt: new Date()
      });
    }
    return result.user;
  } catch (error) {
    throw error;
  }
};

const logout = async () => {
  try {
    await firebaseSignOut(auth);  // Use the aliased import
  } catch (error) {
    throw error;
  }
};

// Export everything needed
export {
  auth,
  db,
  database,
  onAuthStateChanged,
  signUp,
  signIn,
  signInWithGoogle,
  logout,
  deleteDoc,
  // Firestore functions
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  // Realtime Database functions
  ref,
  rtdbQuery,
  orderByChild,
  equalTo,
  get,
  remove
};

export default app;