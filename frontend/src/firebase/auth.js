// src/firebase/auth.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

/* Firebase config - Environment-based for security */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

/* Validate required environment variables */
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
  throw new Error(`Missing Firebase configuration: ${missingEnvVars.join(', ')}`);
}

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
