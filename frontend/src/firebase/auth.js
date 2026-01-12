// src/firebase/auth.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyDiTCMOOya5wKCYpiEK-hSahMCPBCmKKCE",
  authDomain: "rentit-562ce.firebaseapp.com",
  projectId: "rentit-562ce",
  storageBucket: "rentit-562ce.firebasestorage.app",
  messagingSenderId: "706787112715",
  appId: "1:706787112715:web:a8958ca64af8c5a435140e",
  measurementId: "G-03C5PRQPKL",
};

/* Initialize Firebase */
const app = initializeApp(firebaseConfig);

/* Initialize Auth */
const auth = getAuth(app);

/*
  IMPORTANT:
  Persist auth state across:
  - page refresh
  - browser back/forward
  - route changes
*/
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log(" Firebase auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Failed to set auth persistence:", error);
  });

/* Analytics (optional) */
const analytics = getAnalytics(app);

export { auth, app, analytics };
