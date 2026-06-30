# Database Design Recommendation

## Purpose

This document recommends a stronger Firestore schema for a commercial,
multi-tenant pharmacy SaaS application.

The focus is on:

- tenant isolation
- security and authorization
- data modeling for scalability
- predictable rules and query performance
- maintainability for a production SaaS product

## Current design problems

1. Tenant scoping is based only on shared collection fields like `pharmacyId`.
2. User creation and tenant assignment happen in client code, making trust
   boundaries weak.
3. Firestore rules are brittle and require repeated `get()` calls.
4. `users`, `medicines`, `sales`, `stockBatches`, and other collections are all
   top-level, which increases risk of accidental cross-tenant access.
5. `settings` uses mixed global/tenant documents in a single collection without
   explicit separation.
6. Soft-delete semantics are inconsistent and do not clean up Firebase Auth
   accounts.

## Recommended tenant model

Use an explicit tenant root collection and express tenant membership clearly.

### Option A: Namespaced tenant subcollections (preferred)

Collection structure:

- `pharmacies/{pharmacyId}`
  - `members/{userId}`
  - `medicines/{medicineId}`
  - `stockBatches/{stockBatchId}`
  - `sales/{saleId}`
  - `suppliers/{supplierId}`
  - `notifications/{notificationId}`
  - `settings/{settingsId}`
  - `stats/{statId}`

Benefits:

- Tenant data is isolated by path.
- Firestore rules can enforce tenant membership at the top-level path.
- Query and index patterns are simpler because tenant identity is implied by
  document path.
- Tenant lifecycle events are easier to reason about.

## Migrating to Namespaced Tenant Subcollections

Option A is the preferred migration target. Use the following approach to move
slowly and safely from the current top-level tenant-keyed model.

### Migration principles

- Keep the existing top-level collections readable during cutover.
- Write new records to both old and new paths until the migration is complete.
- Move reads one collection at a time, starting with the least risky queries.
- Deploy Firestore rule changes last, after the new tenant paths are populated.
- Preserve document IDs when possible for audit continuity and easier rollback.

### Core tenant path conventions

Use these paths for tenant-scoped data:

- `pharmacies/{pharmacyId}/members/{userId}`
- `pharmacies/{pharmacyId}/medicines/{medicineId}`
- `pharmacies/{pharmacyId}/stockBatches/{stockBatchId}`
- `pharmacies/{pharmacyId}/sales/{saleId}`
- `pharmacies/{pharmacyId}/suppliers/{supplierId}`
- `pharmacies/{pharmacyId}/notifications/{notificationId}`
- `pharmacies/{pharmacyId}/settings/{settingsId}`
- `pharmacies/{pharmacyId}/stats/{statId}`

Keep top-level `pharmacies/{pharmacyId}` for tenant metadata and possibly a
small `users/{userId}` collection only for platform-level identity and
superadmin accounts. Tenant membership and tenant-specific data should be
anchored under the tenant document.

### Strategy for current app code

1. Create a path helper in the frontend and backend:

```js
export const tenantCollection = (pharmacyId, subcol) =>
  collection(db, "pharmacies", pharmacyId, subcol);

export const tenantDoc = (pharmacyId, subcol, docId) =>
  doc(db, "pharmacies", pharmacyId, subcol, docId);
```

2. Update `AuthContext` and tenant membership checks to use
   `pharmacies/{pharmacyId}/members/{userId}`.
   - Keep the existing `users/{uid}` profile as a migration read cache.
   - Use `members` as the authoritative tenant membership source.

3. Replace each collection access in services with tenant-scoped paths:
   - `medicines` → `pharmacies/{pharmacyId}/medicines`
   - `stockBatches` → `pharmacies/{pharmacyId}/stockBatches`
   - `sales` → `pharmacies/{pharmacyId}/sales`
   - `suppliers` → `pharmacies/{pharmacyId}/suppliers`
   - `notifications` → `pharmacies/{pharmacyId}/notifications`
   - `settings` → `pharmacies/{pharmacyId}/settings/{settingsId}`

4. Add compatibility query helpers for read fallback:

```js
const getTenantMedicines = async (pharmacyId) => {
  const newPathQuery = query(
    tenantCollection(pharmacyId, "medicines"),
    where("isDeleted", "==", false),
  );
  const snapshot = await getDocs(newPathQuery);
  if (!snapshot.empty)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const legacyQuery = query(
    collection(db, "medicines"),
    where("pharmacyId", "==", pharmacyId),
    where("isDeleted", "==", false),
  );
  const legacySnapshot = await getDocs(legacyQuery);
  return legacySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
```

5. Migrate settings to tenant-scoped docs:
   - `pharmacies/{pharmacyId}/settings/{settingsId}`
   - keep `settings/global` for defaults
   - avoid `settings` top-level writes after migration

### Phased migration checklist

#### Phase 1: Tenant root and membership

- Create tenant root documents in `pharmacies/{pharmacyId}`.
- Add existing admin/staff into `pharmacies/{pharmacyId}/members/{userId}`.
- Keep `users/{uid}` documents for backward compatibility.
- Update security rules so tenant membership is validated from the new path.

#### Phase 2: Read migration

- Switch frontend and backend read paths for `medicines`, `stockBatches`,
  `sales`, `suppliers`, and `notifications` to tenant subcollections.
- Use a fallback to the old top-level collection until the tenant document is
  fully migrated.
- Keep code that writes legacy root collections in sync during this phase.

#### Phase 3: Write migration

- Update frontend and backend create/update/delete flows to write both paths.
- Prefer the new tenant path in code while retaining duplicate writes.
- Use migration tooling to copy existing root-level documents into the tenant
  subcollections.

#### Phase 4: Cutover and cleanup

- After tenant subcollections are verified, stop writing legacy top-level
  collections.
- Migrate remaining documents and decommission old root-level collections.
- Harden Firestore rules to disallow most direct writes to legacy top-level
  collections.
- Keep legacy reads only while the final cleanup runs.

### Example tenant rules for Option A

```js
match /pharmacies/{pharmacyId} {
  allow read: if isSuperAdmin() || isTenantMember(pharmacyId);
  allow write: if isSuperAdmin();

  match /members/{userId} {
    allow read: if isSuperAdmin() || request.auth.uid == userId || isTenantAdmin(pharmacyId);
    allow write: if isSuperAdmin() || isTenantAdmin(pharmacyId);
  }

  match /medicines/{medicineId} {
    allow read: if isSuperAdmin() || isTenantMember(pharmacyId);
    allow write: if isSuperAdmin() || isTenantAdmin(pharmacyId);
  }

  match /stockBatches/{stockBatchId} {
    allow read, write: if isSuperAdmin() || isTenantMember(pharmacyId);
  }

  match /sales/{saleId} {
    allow read, write: if isSuperAdmin() || isTenantMember(pharmacyId);
  }

  match /suppliers/{supplierId} {
    allow read, write: if isSuperAdmin() || isTenantMember(pharmacyId);
  }

  match /notifications/{notificationId} {
    allow read, write: if isSuperAdmin() || isTenantMember(pharmacyId);
  }

  match /settings/{settingsId} {
    allow read, write: if isSuperAdmin() || isTenantMember(pharmacyId);
  }
}
```

### Migration tooling

Use a dedicated migration script or Cloud Function that:

- enumerates all current `pharmacies` and their `pharmacyId`
- copies `medicines`, `stockBatches`, `sales`, `suppliers`, and `notifications`
  into `pharmacies/{pharmacyId}/{subcollection}`
- creates a `members/{userId}` document for each current user with the same
  tenant metadata
- creates `settings/{settingsId}` documents from legacy `settings` documents
- optionally creates tenant `stats` documents from current aggregated counters

### Recommended migration order for this repo

1. `pharmacies` and `members`
2. `settings`
3. `medicines`
4. `stockBatches`
5. `suppliers`
6. `sales`
7. `notifications`
8. `stats` / `dailySalesStats`
9. `counters` / invoice numbering if you choose to tenant-namespace them

### Notes on `users/{uid}`

- Keep top-level `users` for auth identity if the app still needs it.
- Move `pharmacyId`, `role`, and `status` authoritatively into the tenant
  `members` docs.
- Use `users/{uid}` only for non-tenant platform roles and fallback login
  metadata during migration.

## Why this migration works for your app

- It preserves the existing tenant concept while enforcing it at the path level.
- It makes `pharmacyId` implicit for most tenant CRUD operations.
- It supports safer rules and simpler indexes.
- It allows the backend to become the authoritative gateway for writes over
  time.

### Recommended next step

Add a small `frontend/src/services/firestorePaths.js` helper and a backend
migration script in `backend/scripts/` or `frontend/scripts/` to start the
migration with careful dual-read/dual-write support.

### Important caution

Do not turn off legacy collection access until you can verify tenant data exists
in the new `pharmacies/{pharmacyId}` subcollections for every tenant.

### Quick adoption pattern

- Build one service helper for `tenantCollection(pharmacyId, subcol)`
- Convert one page at a time to new tenant paths
- Validate with one pharmacy tenant end-to-end
- Then migrate the remaining tenants and remove legacy reads

### If you want, I can also generate the actual helper file and a migration

script stub for this repo.

### Option B: Top-level collections with strong tenant keys

Collection structure:

- `pharmacies/{pharmacyId}`
- `users/{userId}`
- `medicines/{medicineId}`
- `stockBatches/{stockBatchId}`
- `sales/{saleId}`
- `suppliers/{supplierId}`
- `notifications/{notificationId}`
- `settings/{settingsId}`
- `stats/{statId}`

Each tenant-scoped document includes:

- `pharmacyId`
- `organizationId`
- `createdBy`
- `tenantRole` or `role` when applicable
- `isDeleted` for soft deletes if needed

This option is viable if you cannot move to nested collections, but it requires
much stronger rules.

## Recommended schema

### `pharmacies` collection

Document: `pharmacies/{pharmacyId}`

Fields:

- `name`: string
- `address`: string
- `phone`: string
- `email`: string
- `adminUid`: string
- `status`: enum(`pending`, `active`, `suspended`, `deactivated`)
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `settingsRef`: reference or implicit subcollection path
- `billingPlan`: string (optional)
- `industry`: string (optional)

### `users` collection

Document: `users/{userId}`

Fields:

- `uid`: string
- `email`: string
- `name`: string
- `role`: enum(`superadmin`, `admin`, `manager`, `pharmacist`, `staff`)
- `pharmacyId`: string
- `status`: enum(`pending`, `active`, `suspended`, `rejected`)
- `createdBy`: string
- `isDeleted`: boolean
- `deletedAt`: timestamp
- `createdAt`: timestamp
- `updatedAt`: timestamp

### `members` subcollection (Option A)

Path: `pharmacies/{pharmacyId}/members/{userId}`

Fields:

- `role`
- `status`
- `email`
- `name`
- `createdAt`
- `updatedAt`

This makes membership explicit and keeps tenant staff under the tenant document.

### `medicines` collection or subcollection

Fields:

- `name`
- `category`
- `description`
- `price`
- `stock`
- `supplierId`
- `expiryDate`
- `status`
- `pharmacyId` (Option B)
- `createdAt`
- `updatedAt`
- `isDeleted`

### `stockBatches` collection or subcollection

Fields:

- `medicineId`
- `batchNumber`
- `quantity`
- `expiryDate`
- `status`
- `pharmacyId` (Option B)
- `createdAt`
- `updatedAt`
- `isDeleted`

### `sales` collection or subcollection

Fields:

- `pharmacyId`
- `userId`
- `totalAmount`
- `items`: array
- `status`
- `createdAt`
- `updatedAt`

### `suppliers` collection or subcollection

Fields:

- `pharmacyId`
- `name`
- `phone`
- `email`
- `address`
- `createdAt`
- `updatedAt`
- `isDeleted`

### `notifications` collection or subcollection

Fields:

- `type`
- `message`
- `pharmacyId`
- `medicineId`
- `isRead`
- `isResolved`
- `createdAt`
- `updatedAt`

### `settings` collection or subcollection

For tenant-specific settings:

- `pharmacies/{pharmacyId}/settings/{settingsId}`

Fields:

- `currency`
- `language`
- `lowStockThreshold`
- `expiryWarningDays`
- `notificationPreferences`
- `updatedAt`

For global defaults:

- `settings/global`

Fields:

- `currency`
- `language`
- `defaultLowStockThreshold`
- `defaultExpiryWarningDays`

## Access control recommendations

### Use tenant membership in rules

For Option A nested collections, rules can be written as:

- allow read/write if `pharmacyExists && isTenantMember`
- allow admin operations if `isTenantAdmin`
- allow superadmin operations if `isSuperAdmin`

For Option B top-level collections, require both:

- `request.auth.uid` is valid
- `request.resource.data.pharmacyId == resource.data.pharmacyId` or the same
  `pharmacyId` path value
- `user.pharmacyId == request.resource.data.pharmacyId`

### Prefer custom claims for platform roles

Use Firebase custom claims for trusted platform roles such as:

- `superadmin`
- `tenantAdmin`
- `tenantManager`

This supports rules that do not require repeated document lookups.

### Avoid client-side tenant assignment

Only the backend or a trusted Cloud Function should create a tenant and set the
initial `pharmacyId` for a user.

Example flow:

1. user signs up via trusted backend endpoint
2. backend creates Auth user, tenant document, and user profile together
3. backend returns credentials or verification email

## Operational guidance

### Tenant onboarding and lifecycle

Keep tenant lifecycle separate from user lifecycle:

- `pending` tenant → no production access
- tenant approval triggers status change
- tenant suspension blocks all tenant-level access
- tenant deletion should archive or soft-delete tenant documents

### Soft delete vs hard delete

For any entity with business meaning:

- prefer soft delete with `isDeleted` and `deletedAt`
- preserve audit history for sales, stock, and regulatory compliance
- delete Firebase Auth accounts only when Firestore user document is hard
  deleted by an administrative trusted process

### Audit and reporting

Store derived tenant metrics carefully. Recommended collections:

- `pharmacies/{pharmacyId}/stats/{statId}`
- `pharmacies/{pharmacyId}/dailySales/{date}`
- `pharmacies/{pharmacyId}/counters/{counterId}`

Avoid mixing tenant counters into a single global collection unless the
documents are namespaced by tenant.

## Example document structures

### Example tenant document

Path: `pharmacies/{pharmacyId}`

```json
{
  "name": "My Pharmacy",
  "address": "123 Main St",
  "phone": "+251911111111",
  "email": "admin@mypharmacy.com",
  "adminUid": "uid123",
  "status": "pending",
  "createdAt": "2026-06-18T00:00:00Z",
  "updatedAt": "2026-06-18T00:00:00Z"
}
```

### Example user document

Path: `users/{uid}`

```json
{
  "uid": "uid123",
  "email": "admin@mypharmacy.com",
  "name": "Alice Admin",
  "role": "admin",
  "pharmacyId": "pharmacy123",
  "status": "active",
  "createdBy": "system",
  "createdAt": "2026-06-18T00:00:00Z",
  "updatedAt": "2026-06-18T00:00:00Z"
}
```

### Example medicine document

Path: `pharmacies/{pharmacyId}/medicines/{medicineId}`

```json
{
  "name": "Paracetamol",
  "category": "Pain Relief",
  "price": 45,
  "stock": 120,
  "expiryDate": "2027-03-01T00:00:00Z",
  "status": "In Stock",
  "createdAt": "2026-06-18T00:00:00Z",
  "updatedAt": "2026-06-18T00:00:00Z"
}
```

## Migration guidance

1. Keep current collections working while introducing tenant root documents.
2. Copy existing `pharmacies` to the new tenant root if needed.
3. Migrate `users` to include explicit `pharmacyId` and `status` semantics.
4. Backfill tenant IDs for `medicines`, `sales`, `stockBatches`, `suppliers`,
   and `notifications`.
5. Update Firestore rules incrementally and test with the simulator.
6. Move sensitive create/update operations behind backend logic or Cloud
   Functions.

## Summary

A strong Firestore SaaS design for this app should:

- make tenant identity explicit
- enforce tenant membership in rules
- remove client-only tenant creation control
- keep global defaults separate from tenant settings
- use nested tenant subcollections where practical
- lock down role authorization with a trusted backend layer

This design improves security, simplifies rule enforcement, and reduces the risk
of cross-tenant data access in a commercial multi-tenant environment.
