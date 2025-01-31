import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQJcZPgf2hqDn7OWaD3H0Y2l5a2x61NOk",
  authDomain: "fir-15a95.firebaseapp.com",
  projectId: "fir-15a95",
  storageBucket: "fir-15a95.firebasestorage.app",
  messagingSenderId: "824813157601",
  appId: "1:824813157601:web:a338250b83d359c8bbcba0",
  measurementId: "G-NSMWTET0PR"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
