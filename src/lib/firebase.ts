import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, push, update, remove, onValue, query, orderByChild } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBzTDTD2YN19kyE_BM-and62V2heGZbK5k",
  authDomain: "sevinro-distributors.firebaseapp.com",
  databaseURL: "https://sevinro-distributors-default-rtdb.firebaseio.com",
  projectId: "sevinro-distributors",
  storageBucket: "sevinro-distributors.firebasestorage.app",
  messagingSenderId: "16376436724",
  appId: "1:16376436724:web:deb83d6182bd0db2778ba1",
  measurementId: "G-BYCTGFEY9V",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

export { ref, get, set, push, update, remove, onValue, query, orderByChild, signInWithEmailAndPassword, signOut, onAuthStateChanged };
