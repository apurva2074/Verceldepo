import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firestore";

export async function fetchUserRole(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return data?.role || null;
}
