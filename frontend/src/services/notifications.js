import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { NOTIFICATIONS_COLLECTION } from "./collections.js";



// Deterministic ID so repeated detection upserts the same doc instead of duplicating
const buildNotifId = (pharmacyId, medicineId, type) =>
  `${pharmacyId}_${medicineId}_${type}`;

export const upsertNotification = async (pharmacyId, medicineId, type, data) => {
  const id = buildNotifId(pharmacyId, medicineId, type);
  const ref = doc(db, NOTIFICATIONS_COLLECTION, id);
  await setDoc(
    ref,
    {
      pharmacyId,
      medicineId,
      type, // 'expired' | 'expiring' | 'low-stock' | 'out-of-stock'
      ...data,
      isRead: false, // reset to unread if condition re-triggers after being cleared
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const resolveNotification = async (pharmacyId, medicineId, type) => {
  const id = buildNotifId(pharmacyId, medicineId, type);
  const ref = doc(db, NOTIFICATIONS_COLLECTION, id);
  await updateDoc(ref, { isResolved: true, updatedAt: serverTimestamp() }).catch(() => {});
};

export const markNotificationRead = async (notificationId) => {
  const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(ref, { isRead: true, readAt: serverTimestamp() });
};

export const markAllNotificationsRead = async (notificationIds) => {
  await Promise.all(
    notificationIds.map((id) =>
      updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), {
        isRead: true,
        readAt: serverTimestamp(),
      }),
    ),
  );
};

export const subscribeToNotifications = (pharmacyId, callback) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("pharmacyId", "==", pharmacyId),
    where("isResolved", "==", false),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(notifs);
    },
    (error) => console.error("Error in notifications subscription:", error),
  );
};
