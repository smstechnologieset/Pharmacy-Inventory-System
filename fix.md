# Error Analysis: FirebaseError: Missing or insufficient permissions

## Why it's happening:

The error `FirebaseError: Missing or insufficient permissions.` during user profile creation (specifically within `createUserProfile` in `firestoreService.js` called from `AuthContext.jsx` after a new user signs up in `Signup.jsx`) indicates that the Firebase Security Rules are preventing the newly authenticated user from creating their own user profile document in the `users` collection.

Let's break down the relevant parts:

1.  **`AuthContext.jsx` (line 126):**
    ```javascript
    await createUserProfile(firebaseUser.uid, {
      email,
      name,
      role,
      phone,
      pharmacyName,
    });
    ```
    This line attempts to call the `createUserProfile` function immediately after a user successfully authenticates with Firebase Authentication (`signUp`). The `firebaseUser.uid` is used as the document ID for the new user profile.

2.  **`firestoreService.js` (`createUserProfile` function, line 417):
    ```javascript
    export const createUserProfile = async (uid, userData) => {
      try {
        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const profileData = {
          uid,
          email: userData.email,
          name: userData.name || "",
          role: userData.role || "staff", // The default role here is "staff"
          pharmacyId: userData.pharmacyId || null,
          pharmacyName: userData.pharmacyName || "",
          createdBy: userData.createdBy || null,
          avatar: userData.avatar || `https://i.pravatar.cc/150?u=${uid}`,
          status: "Active", // The default status here is "Active"
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, profileData);
        return profileData;
      } catch (error) {
        console.error("Error creating user profile:", error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }
    };
    ```
    This function attempts to use `setDoc` to create a new document in the `users` collection with the authenticated user's `uid` as the document ID.

3.  **`firestore.rules` (lines 38-41):**
    ```firestore
    match /users/{userId} {
      allow create: if
          request.auth.uid == userId &&
          request.resource.data.role == 'admin' &&
          request.resource.data.status == 'pending';
    }
    ```
    These are the security rules governing the creation of user documents. For a user to create their own profile, ALL of these conditions must be met:
    *   `request.auth.uid == userId`: The authenticated user's UID must match the `userId` in the path (which is the document ID). This condition is likely met because `createUserProfile` uses `firebaseUser.uid` for the document ID.
    *   `request.resource.data.role == 'admin'`: The `role` field in the *new document being written* must be exactly `'admin'`.
    *   `request.resource.data.status == 'pending'`: The `status` field in the *new document being written* must be exactly `'pending'`.

The problem lies in the `createUserProfile` function where the `profileData` is constructed:

```javascript
const profileData = {
  // ... other fields
  role: userData.role || "staff", // The default role here is "staff"
  // ... other fields
  status: "Active", // The default status here is "Active"
  // ... other fields
};
```

When `createUserProfile` is called from `AuthContext.jsx`, the `role` is passed as `'admin'` (from `Signup.jsx`, line 64: `await signup(email, password, name, "admin", phone, pharmacyName);`). However, the `status` field is explicitly set to `
