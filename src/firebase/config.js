// src/firebase/config.js
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCnbmW1Qxx4NUSixHEynuBG5iqc-1NRciY",
  authDomain: "expence-tracker-web.firebaseapp.com",
  projectId: "expence-tracker-web",
  storageBucket: "expence-tracker-web.firebasestorage.app",
  messagingSenderId: "355120977754",
  appId: "1:355120977754:web:7b0e7fb6274a6630ed8563",
  measurementId: "G-8S912K4D51",
};

// ✅ Prevent duplicate initialization
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export default app;
