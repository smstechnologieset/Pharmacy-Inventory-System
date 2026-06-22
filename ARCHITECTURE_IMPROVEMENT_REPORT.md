# Architecture Improvement Report

## Overview

This report reviews the current `Pharmacy-Inventory-System` codebase from a
commercial, multi-tenant SaaS perspective. It focuses on critical design risks,
tenant isolation, security, maintainability, and operational assumptions.

## Critical Risks

### 1. Tenant isolation is weak and can be bypassed

- The app uses a single Firestore database with tenant scoping by `pharmacyId`
  across collections.
- Security rules rely on user profile document fields (`users/{uid}.pharmacyId`)
  to decide access.
- The `users` collection create rule in `firestore.rules` allows any
  authenticated user to create their own profile if:
  - `request.auth.uid == userId`
  - `request.resource.data.role == 'admin'`
  - `request.resource.data.status == 'pending'`
- There is no rule preventing a newly created profile from setting `pharmacyId`
  to any existing tenant or arbitrary value.
- As a result, a malicious user can self-provision tenant membership and gain
  access to pharmacy-scoped documents if Firestore rules do not catch the
  `pharmacyId` claim.

### 2. Security rules are brittle and expensive

- `firestore.rules` repeatedly calls `get()` on the user document for every
  request.
  - `getUserRole()` and `getUserPharmacyId()` both do an existence check and a
    `get()`.
  - This pattern increases the chance of rule evaluation costs and can be
    fragile under load.
- `isPharmacyMember(pharmacyId)` trusts the `pharmacyId` field from user profile
  without additional safeguards.
- The rule set does not clearly separate tenant-wide admin roles from
  platform-wide roles.
- There are direct writes to tenant-scoped collections that use
  `request.resource.data.pharmacyId` without strong validation.

### 3. Front-end access control is insufficient for SaaS

- `src/App.jsx` protects routes with client-side `RoleGuard` and
  `ProtectedRoute` logic.
- UI filtering and route guards are useful but are not enough for security in a
  multi-tenant SaaS app.
- Security must be enforced by backend rules or server-side logic; the current
  front-end enforcement only improves UX.

### 4. Admin-level user creation is performed entirely in client code

- `src/services/users.js` has `createStaffAccount()` that uses a secondary
  Firebase app to create Auth users from the browser.
- This means admin privileges are effectively enforced only by the client and
  not by a trusted backend.
- An attacker with browser access can call the same client-side function if they
  can access or reverse-engineer the UI.
- This is a major architectural weakness for any commercial SaaS app.

### 5. Inconsistent deletion semantics and orphaned Auth accounts

- `src/services/users.js` implements `softDeleteUser()` and marks Firestore user
  docs as deleted.
- `functions/index.js` only deletes Firebase Auth users when a Firestore
  `users/{userId}` document is deleted, not when it is softly deleted.
- Therefore "delete" in the app does not remove the Auth account.
- This creates stale backend accounts, security residue, and business logic
  inconsistency.

### 6. Tenant creation flow lacks rollback and transactional safety

- `src/context/AuthContext.jsx` `signup()` performs:
  1. Firebase Auth signup
  2. createPharmacy()
  3. createUserProfile()
- If step 2 or 3 fails after Auth creation succeeds, the user can remain
  registered without a valid work profile.
- There is no rollback or cleanup for failed signup flows.
- This is especially risky for a multi-tenant signup flow where an incomplete
  tenant can leave orphaned data.

### 7. Pharmacy status handling can be bypassed on transient errors

- `AuthContext.jsx` defaults `pharmacyStatus` to `active` if `getPharmacyById()`
  fails.
- This means service interruptions in Firestore can accidentally permit access
  for suspended or pending tenants.

## Bad Architectural Decisions

### 1. Monolithic / duplicated service layer

- There are multiple service modules (`pharmacies.js`, `users.js`,
  `medicines.js`, `sales.js`, etc.) but also a huge commented-out
  `src/services/firestoreService.js`.
- This suggests unfinished refactoring and creates maintenance debt.
- Business logic is duplicated and spread between service modules and page
  components.

### 2. Client includes server-only dependency

- `package.json` installs `firebase-admin` in the root package.
- `firebase-admin` is server-side only and should not be part of the browser
  bundle or client dependency tree.
- This is a packaging and architectural smell that can cause build issues and
  confusion.

### 3. Poor separation of UI and business logic

- Pages like `Staff.jsx`, `SuperAdmin.jsx`, and `Signup.jsx` include heavy
  business logic, form handling, and service orchestration.
- This reduces readability, increases bug risk, and makes unit testing harder.

### 4. Role names and role guard logic are duplicated

- Role constants are centralized in `src/constants/roles.js`, but many places
  still hardcode role arrays.
- Example: `src/App.jsx`, `src/components/Sidebar.jsx`, and other components use
  repeated role lists.
- This is brittle and error-prone as the role model evolves.

### 5. Tenant scoping is implemented via properties, not namespaces

- All tenant data is stored in top-level collections with a `pharmacyId` field.
- This is workable for Firestore, but it is less designed for a commercial SaaS
  app than a stronger scoped namespace.
- This approach also makes queries and indexing more complex across tenant
  aggregates.

## Data Model and Multi-Tenant Issues

### 1. Tenant data is not strongly validated

- Collections like `medicines`, `stockBatches`, `sales`, `suppliers` only rely
  on client and rules-level `pharmacyId` values.
- There is no server-side enforcement that these collections belong to an
  approved tenant or valid admin.

### 2. Global vs tenant settings mix

- `src/services/settings.js` stores both `global` settings and tenant-specific
  settings in the same `settings` collection.
- This is workable, but the architecture should explicitly document how global
  fallback works.
- The current code automatically creates a `settings` doc with default values on
  read, which may create many empty documents for each tenant.

### 3. Metrics, counters, and stats are separate top-level collections

- `pharmacyStats`, `dailySalesStats`, `counters` are all separate collections.
- Without server-side aggregation and transaction guarantees, this is easy to
  get inconsistent or hard to query for reporting.

## Security and Operational Concerns

### 1. Auth state and user profile synchronization complexity

- `AuthContext.jsx` maintains both `authUser` and `user` state.
- `user` is built from Firestore profile snapshot, while `authUser` comes from
  Firebase Auth.
- These two sources can diverge and are coupled with multiple async flows.
- `login()` manually sets `user`, but the auth listener may also update it
  later.

### 2. Lack of robust server-side role enforcement

- The app exposes `createStaffAccount()`, `getAllUsers()`,
  `updateUserProfile()`, `createPharmacy()`, and more directly from client code.
- If any of these functions are called outside the intended UI, the app could
  behave incorrectly.
- For SaaS, the trusted enforcement plane should be backend functions or secure
  rules, not the browser.

### 3. Potential privilege escalation via client-supplied tenant fields

- Many rules and service functions treat `pharmacyId` as the key trust boundary.
- A user can potentially supply a different `pharmacyId` in a request and, if
  rules are not strict enough, gain access.
- This is particularly risky during signup and staff creation.

### 4. Missing test coverage and CI guardrails

- The repo has no evidence of automated tests, contract validation, or
  end-to-end security tests.
- For a commercial SaaS product, this is a significant operational risk.

## Recommendations

### Immediate fixes

1. Harden Firestore rules:
   - Do not permit client-controlled tenant assignment without validation.
   - Require the authenticated user to have an explicit approved relationship
     for the requested `pharmacyId`.
   - Avoid repeated `get()` calls and use custom claims if possible.
2. Move all Auth user creation for staff to a backend function or Cloud
   Function.
3. Fix `signup()` to use a safe transactional approach or backend signup
   endpoint.
4. Resolve soft-delete vs Auth delete mismatch.
5. Remove `firebase-admin` from client-side `package.json` and isolate
   server-only dependencies.

### Medium-term architecture improvements

1. Build a trusted server-side tenant creation and membership workflow.
2. Refactor service modules to a consistent, modular API layer.
3. Centralize role access rules and avoid hardcoded role arrays in multiple
   components.
4. Add explicit tenant-aware query helpers, e.g.
   `getTenantQuery(collection, pharmacyId)`.
5. Introduce regression tests for multi-tenant access scenarios.

### Strategic product-level changes

1. Define a clear tenant model:
   - superadmin = platform-level
   - admin = tenant owner
   - manager/pharmacist/staff = tenant users
2. Use server-side claims or an access control layer that does not depend only
   on Firestore document fields.
3. Consider moving tenant data into a namespaced collection structure if scaling
   requires it.
4. Add audit logging and admin approval workflow for tenant onboarding.

## Key files to address first

- `firestore.rules`
- `src/context/AuthContext.jsx`
- `src/services/users.js`
- `src/pages/SuperAdmin.jsx`
- `src/App.jsx`
- `src/components/Sidebar.jsx`
- `package.json`

## Conclusion

This codebase contains the core features needed for a pharmacy SaaS app, but the
current multi-tenant architecture is only partially secure and is fragile for
commercial deployment.

The most urgent areas are tenant isolation, backend user creation, transactional
signup, and cleanup of client/server dependency boundaries.

Addressing those topics first will make the platform viable for a real
multi-tenant SaaS roll-out.
