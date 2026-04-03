// src/firebase/storage.js
import { app } from "./auth";
import { getStorage } from "firebase/storage";

export const storage = getStorage(app);
export default storage;
