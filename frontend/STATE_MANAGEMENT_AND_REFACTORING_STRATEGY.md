# Frontend State Management and Refactoring Strategy

## 1. Current Frontend State Landscape

The frontend currently uses a mix of patterns:

- `AuthContext` and `SettingsContext` for global auth and configuration state.
- `useState` + `useEffect` in most pages to fetch data and manage local UI.
- `react-query` is configured in `src/App.jsx`, but only a single page
  (`Medicine.jsx`) currently uses it.
- Duplicate data-loading workflows appear in `Sales.jsx`, `Reports.jsx`,
  `Inventory.jsx`, `Expiration.jsx`, `Settings.jsx`, and other pages.
- Many components hold both server data and UI state in local hooks, which makes
  them hard to maintain and test.

## 2. Recommended Strategy

### 2.1 Use React Query for all async server state

React Query is already available in the project. The best fit is to use it as
the single source of truth for remote data.

- Convert data fetching in pages to custom query hooks.
- Use `useMutation` for create/update/delete operations.
- Use query invalidation instead of manual local state updates where possible.
- Keep `staleTime`, `cacheTime`, and `retry` consistent for related domain data.

This gives you:

- centralized data loading and caching
- consistent loading / error handling
- automatic refetching after mutations
- easier sharing of server state between pages

### 2.2 Keep local state only for UI/interaction state

Use React state only for transient UI state such as:

- modals open/closed
- search terms
- sort/filter values
- current tab selection
- form drafts while editing
- cart contents and receipt preview

Avoid storing server-managed lists like `sales`, `medicines`, `batches`,
`suppliers` in component state after switching to React Query.

### 2.3 Use domain-specific hooks for page logic

Create reusable hooks that encapsulate page behavior and derived values.

Examples:

- `useMedicines(pharmacyId)`
- `useStockBatches(pharmacyId)`
- `useSales(pharmacyId, params)`
- `useInventoryActions()`
- `useReportsData(reportPeriod, pharmacyId)`
- `useCart()`
- `useAuthStatus()`

This helps separate UI from business logic and reduces component complexity.

### 2.4 Keep contexts narrow and minimal

The current contexts are valuable, but they can be made more predictable.

- `AuthContext` should expose only auth/user state and auth actions.
- `SettingsContext` should expose settings, language, and a translation helper.
- Consider using React Query inside `SettingsContext` to fetch system settings
  rather than `useEffect` + manual state.

## 3. Practical Refactoring Roadmap

### 3.1 Create shared query and mutation hooks

Add a new directory:

- `frontend/src/hooks/queries/`
- `frontend/src/hooks/mutations/`

Example files:

- `useMedicines.js`
- `useSuppliers.js`
- `useStockBatches.js`
- `useSales.js`
- `useTransactions.js`
- `useSystemSettings.js`

Example structure:

```js
export const useMedicines = (pharmacyId) =>
  useQuery({
    queryKey: ["medicines", pharmacyId],
    queryFn: () => getAllMedicines(pharmacyId),
    enabled: !!pharmacyId,
    staleTime: 60 * 1000,
  });
```

### 3.2 Refactor pages to use query hooks

For pages like `Sales.jsx`, `Reports.jsx`, `Inventory.jsx`, `Expiration.jsx`,
and `Suppliers.jsx`:

- replace manual `useEffect` loads with `useQuery`
- remove redundant `loading` / `error` state where query already provides them
- use `data` from React Query and `useMemo` for derived values
- keep only UI state in the page component

Example page state split:

- server state: product list, sales list, inventory batches
- UI state: search term, selected period, open modal, current cart

### 3.3 Refactor mutations and side-effects

For create/update/delete flows, use `useMutation` and query invalidation.

Example:

```js
const createMedicineMutation = useMutation({
  mutationFn: (payload) => createMedicine(payload, pharmacyId),
  onSuccess: () => {
    queryClient.invalidateQueries(["medicines", pharmacyId]);
  },
});
```

This is cleaner than manual list updates and avoids stale cache problems.

### 3.4 Extract helpers and utilities

Move shared helper logic from pages into utility modules:

- expiry/status calculations
- date range builders
- chart label builders
- sales filtering functions
- FEFO batch selection logic
- translation helpers

Place these in:

- `frontend/src/utils/` or
- `frontend/src/lib/`

## 4. Suggested File Structure

A clearer frontend structure will help maintainability:

- `src/api/` or `src/services/` — API wrappers remain here
- `src/hooks/` — custom hooks
- `src/queries/` — React Query helpers and keys
- `src/context/` — auth/settings contexts
- `src/pages/` — page components only
- `src/components/` — presentational and shared UI
- `src/utils/` — generic utilities

For example:

- `src/hooks/useMedicines.js`
- `src/hooks/useInventory.js`
- `src/hooks/useSales.js`
- `src/hooks/useReportData.js`
- `src/hooks/useSystemSettings.js`

## 5. Page-level Refactor Priorities

### 5.1 `Sales.jsx`

Refactor to:

- use `useQuery` for medicines, stock batches, recent sales
- derive `productGrid` with `useMemo`
- manage only cart state and checkout UI locally
- extract checkout and stock notification logic into hooks

### 5.2 `Reports.jsx`

Refactor to:

- use `useQuery` for sales and batch data, keyed by `reportPeriod` or date range
- use `useQuery` for system settings instead of manual fetch
- keep derived chart data in `useMemo`
- remove manual `loading` state in favor of query flags

### 5.3 `Inventory.jsx` and `Medicine.jsx`

- keep `Medicine.jsx` style as the model and extend it.
- move repeated inventory filtering / sort logic into utilities.
- use optimistic updates or query invalidation consistently.

### 5.4 `SettingsContext.jsx`

- fetch global settings through React Query
- keep language state in context and persist it via `localStorage`
- expose `t()` translation helper and update action

## 6. When to keep or add local state

Use local component state for:

- UI modal open/close booleans
- form field values while editing
- local filters/search inputs
- temporary client-only values not persisted to the server

Avoid local state for:

- list data loaded from Firestore
- cross-page shared items like products, batches, sales reports
- any value that should be cached and reused globally

## 7. Optional future improvement

If the app grows beyond Firebase/React Query and needs more global non-server
state, consider a lightweight global state library such as `zustand` for:

- offline UI state
- complex shared selection state
- cross-page non-persistent interactions

However, for this app today, React Query + focused contexts is the best balance.

## 8. Quick wins

- refactor `Sales.jsx`, `Reports.jsx`, and `Inventory.jsx` first
- extract shared request logic into hooks
- delete duplicate loading/error management code
- keep UI-only state inside components
- use `queryClient.invalidateQueries()` after every mutation

## 9. Summary

This frontend should be organized around three state domains:

1. Server state: React Query
2. Global app state: Auth + Settings contexts
3. Local UI state: component hooks for modals/filters/forms

That architecture will reduce duplication, make pages easier to test, and let
you scale the frontend without adding a heavyweight state library.
