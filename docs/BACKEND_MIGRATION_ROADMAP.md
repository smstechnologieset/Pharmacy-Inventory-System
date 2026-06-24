# Backend Migration Roadmap

This roadmap is designed for a gradual, low-risk migration from frontend-centric
Firebase logic to a backend-driven architecture. Each phase is intentionally
small, enabling incremental delivery while preserving current app behavior.

## Goals

- Move critical business logic out of the browser in small steps
- Preserve user experience and avoid downtime
- Improve security, consistency, and auditability
- Keep tenant boundaries explicit and enforceable
- Reduce expensive client-side Firestore reads and writes over time

## Phase 1: Foundation and secure backend entry points

### 1.1 Create a backend endpoint for staff account creation

- Move `frontend/src/services/users.js:createStaffAccount` to the backend
- Expose a secure endpoint such as `POST /api/users/staff`
- Validate `pharmacyId`, `role`, and `email` server-side
- Use Firebase Admin SDK for account creation and Firestore profile creation
- Keep the existing frontend path intact until backend is fully verified

### 1.2 Move pharmacy status updates to backend

- Migrate `frontend/src/services/pharmacies.js:updateUserStatusByPharmacyId` to
  backend
- Expose `POST /api/pharmacies/:id/users/status`
- Use server-side verification of superadmin/admin role and tenant ownership
- Keep frontend calls stable while re-routing to backend

### 1.3 Add a protected backend health check and authentication guard

- Confirm `backend/src/index.js` has authentication and role verification
  middleware ready
- Add a middleware layer that can authenticate Firebase ID tokens for future
  endpoints

## Phase 2: Backend checkout and inventory write operations

### 2.1 First backend transaction: sale checkout

- Migrate `frontend/src/services/transactions.js:processCheckoutTransaction` to
  the backend
- Create `POST /api/transactions/checkout`
- Keep the frontend UI and cart unchanged; swap only the service call
- Validate stock quantities, `pharmacyId`, and user identity server-side
- Update counter, `stockBatches`, `medicines.totalStock`, `sales`,
  `pharmacyStats`, and `dailySalesStats` inside a server transaction

### 2.2 Add checkout audit logging and error mapping

- Ensure backend returns clear validation failures for insufficient stock or
  stale batches
- Keep client-side error handling unchanged for a smooth transition

### 2.3 Add refund processing to backend

- Migrate `processRefundTransaction` from frontend to backend
- Expose `POST /api/transactions/refund`
- Leave frontend UI logic untouched while switching the service implementation

## Phase 3: Move stock management operations

### 3.1 Backend stock batch create / update / delete

- Migrate `createStockBatch`, `updateStockBatch`, and `deleteStockBatch` from
  `frontend/src/services/stockBatches.js`
- Create corresponding backend endpoints under `/api/stock-batches`
- Validate tenant safety and update `medicines.totalStock` transactionally on
  the server
- Preserve frontend payload shape, then replace service calls only

### 3.2 Move stock movement audit trail creation to backend

- Add a backend helper for `stockMovements` writes
- Ensure `stockMovements` logging is always executed as part of the same backend
  workflow or as a follow-up backend API call

## Phase 4: Consolidate tenant-sensitive workflows

### 4.1 Backend pharmacy / user administration

- Migrate pharmacy creation, activation, suspension, and user profile changes to
  backend routes
- Keep frontend role-based navigation and UI checks, but shift policy
  enforcement to the server

### 4.2 Backend settings and system configuration

- Move `settings` updates to backend endpoints
- Keep `getSystemSettings` reads client-side initially, then consider caching at
  the backend or edge

## Phase 5: Optimize data flow and page hydration

### 5.1 Replace full collection loads with paged backend endpoints

- Inventory: serve paginated `stockBatches` + joined medicine metadata from
  backend
- Sales: serve paginated sales list with tenant filtering and date range support
- Dashboard: serve pre-aggregated metrics from backend or Cloud Function

### 5.2 Keep UI unchanged while swapping service implementation

- For each endpoint, first build the backend API and compatibility shim
- Then update one frontend service at a time to call the backend instead of
  Firestore directly

## Phase 6: Harden security and phase out client-side trust

### 6.1 Tighten Firestore Security Rules

- After backend endpoints are stable, update rules so only backend service
  accounts may write high-risk collections directly
- Continue allowing limited frontend reads for tenant-scoped queries where
  needed

### 6.2 Add explicit tenant path enforcement

- Consider moving hot collections into tenant-scoped paths such as:
  - `/pharmacies/{pharmacyId}/medicines`
  - `/pharmacies/{pharmacyId}/stockBatches`
  - `/pharmacies/{pharmacyId}/sales`
- Migrate reads/writes gradually, keeping legacy paths readable until migration
  is complete

## Recommended small-step order

1. Staff account creation backend endpoint
2. Pharmacy status update backend endpoint
3. Secure backend auth middleware
4. Checkout transaction backend endpoint
5. Refund transaction backend endpoint
6. Stock batch management backend endpoints
7. Stock movement logging backend helper
8. Pharmacy and user admin backend endpoints
9. Backend paged inventory/sales endpoints
10. Firestore security rule hardening and tenant path migration

## Migration best practices

- Use feature flags or branch-safe routing in the frontend to switch to backend
  endpoints gradually
- Keep both client-side and backend paths available during cutover
- Ensure backend endpoint payloads mirror existing Firestore service contracts
- Log backend validation failures to identify any client-side assumptions
- Test each step with one tenant before wider rollout

## Notes for slow migration

- Do not attempt to move all write logic in one release
- Keep direct Firestore reads in place until the backend can supply the same
  data shape reliably
- Use backend routes for sensitive operations first, then migrate read-heavy
  pages later
- Maintain a stable UI while progressively shifting implementation details

---

This roadmap is intentionally incremental: the first backend work should be the
smallest high-value logic (`staff creation`, `checkout`, `refund`) and only
later the broader inventory and reporting access. If you want, I can also
generate a second file with actual backend endpoint definitions and example
request/response shapes.
