import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBYogfcusSyO9O0A6URw7B5G72UBZJfI2Q",
  authDomain: "hibu-9d170.firebaseapp.com",
  projectId: "hibu-9d170",
  storageBucket: "hibu-9d170.firebasestorage.app",
  messagingSenderId: "866443355770",
  appId: "1:866443355770:web:817b8143532e42bea3bdc3",
  measurementId: "G-HVWTW5411F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
