// src/firebase/firestore.js
import { app } from "./auth";

import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);
export default db;
