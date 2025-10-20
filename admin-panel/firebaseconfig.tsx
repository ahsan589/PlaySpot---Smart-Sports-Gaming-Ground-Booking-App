import { initializeApp } from "firebase/app";
import { getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeJ_UC5Fg160ri_qJjUWRSwhUL1b-D-iU",
  authDomain: "indoorgames-6b42b.firebaseapp.com",
  projectId: "indoorgames-6b42b",
  storageBucket: "indoorgames-6b42b.firebasestorage.app",
  messagingSenderId: "356197086590",
  appId: "1:356197086590:web:053adbb250959d41d62f2f",
  measurementId: "G-1T6R4MGV2H"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export const functions = getFunctions(app);

// Analytics is only available in browser environments

export { auth, db };

