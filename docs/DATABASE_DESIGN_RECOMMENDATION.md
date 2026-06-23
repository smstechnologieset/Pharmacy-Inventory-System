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
