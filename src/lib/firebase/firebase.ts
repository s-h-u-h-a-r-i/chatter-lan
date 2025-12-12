import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDK2ACI5GOlv2a_u5ZJUkZDMfEGBsK7-_E",
  authDomain: "chatter-lan.firebaseapp.com",
  databaseURL: "https://chatter-lan-default-rtdb.firebaseio.com",
  projectId: "chatter-lan",
  storageBucket: "chatter-lan.firebasestorage.app",
  messagingSenderId: "286477709602",
  appId: "1:286477709602:web:31a996d38c714bc103f57b",
  measurementId: "G-ZX8CZ15M54",
} as const;

initializeApp(firebaseConfig);

export const firestore = getFirestore();
