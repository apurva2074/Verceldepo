import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/firestore";

export const toggleWishlist = async (propertyId, tenantId) => {
  const q = query(
    collection(db, "wishlists"),
    where("propertyId", "==", propertyId),
    where("tenantId", "==", tenantId)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    // Already liked → remove
    await deleteDoc(doc(db, "wishlists", snap.docs[0].id));
    return false;
  }

  // Not liked → add
  await addDoc(collection(db, "wishlists"), {
    propertyId,
    tenantId,
    created_at: new Date(),
  });

  return true;
};

export const isWishlisted = async (propertyId, tenantId) => {
  const q = query(
    collection(db, "wishlists"),
    where("propertyId", "==", propertyId),
    where("tenantId", "==", tenantId)
  );

  const snap = await getDocs(q);
  return !snap.empty;
};
