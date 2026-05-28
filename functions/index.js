import { firestore } from "firebase-functions/v1";
import { initializeApp, auth } from "firebase-admin";

// Initialize the Admin SDK (gives us God-mode access to Auth)
initializeApp();

export const cleanupAuthOnUserDelete = firestore
  .document("users/{userId}")
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;

    try {
      // Delete the user from Firebase Authentication
      await auth().deleteUser(userId);
      console.log(`✅ Successfully deleted Auth user: ${userId}`);
    } catch (error) {
      // If the user was already deleted from Auth, don't crash the function
      if (error.code === "auth/user-not-found") {
        console.log(`ℹ️ User ${userId} not found in Auth. Nothing to delete.`);
      } else {
        console.error(`❌ Error deleting Auth user ${userId}:`, error);
      }
    }
  });
