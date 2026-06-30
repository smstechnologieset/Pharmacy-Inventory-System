import {
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { NOTIFICATIONS_COLLECTION } from "./collections.js";
import { tenantCollection, tenantDoc } from "./firestorePaths.js";



// Deterministic ID so repeated detection upserts the same doc instead of duplicating
const buildNotifId = (pharmacyId, medicineId, type) =>
  `${pharmacyId}_${medicineId}_${type}`;

export const upsertNotification = async (pharmacyId, medicineId, type, data) => {
  const id = buildNotifId(pharmacyId, medicineId, type);
  const ref = tenantDoc(pharmacyId, NOTIFICATIONS_COLLECTION, id);
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
  const ref = tenantDoc(pharmacyId, NOTIFICATIONS_COLLECTION, id);
  await updateDoc(ref, { isResolved: true, updatedAt: serverTimestamp() }).catch(() => {});
};

export const markNotificationRead = async (pharmacyId, notificationId) => {
  const ref = tenantDoc(pharmacyId, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(ref, { isRead: true, readAt: serverTimestamp() });
};

export const markAllNotificationsRead = async (pharmacyId, notificationIds) => {
  await Promise.all(
    notificationIds.map((id) =>
      updateDoc(tenantDoc(pharmacyId, NOTIFICATIONS_COLLECTION, id), {
        isRead: true,
        readAt: serverTimestamp(),
      }),
    ),
  );
};

export const subscribeToNotifications = (pharmacyId, callback) => {
  const q = query(
    tenantCollection(pharmacyId, NOTIFICATIONS_COLLECTION),
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
