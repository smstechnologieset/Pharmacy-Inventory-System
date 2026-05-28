# Localization Guide

This guide explains how to add localization (English and Amharic) for any new feature, page, or component you add to the Pharmacy Inventory System.

## Step 1: Add Strings to the Dictionary

The central dictionary is located at `src/data/translations.js`. It has two main sections: `en` (English) and `am` (Amharic).

When adding a new page (e.g., `Customers.jsx`), create a new section in both languages.

```javascript
// In src/data/translations.js
export const translations = {
  en: {
    // ... existing pages
    customers: {
      title: "Customers Management",
      addCustomer: "Add Customer",
      searchPlaceholder: "Search by name...",
      // add more labels, buttons, messages here
    }
  },
  am: {
    // ... existing pages
    customers: {
      title: "የደንበኞች አስተዳደር",
      addCustomer: "ደንበኛ አክል",
      searchPlaceholder: "በስም ይፈልጉ...",
      // add translated labels here
    }
  }
};
```

## Step 2: Import `useSettings` in Your Component

In your new React component file (e.g., `src/pages/Customers.jsx`), import the `useSettings` hook.

```javascript
import { useSettings } from "../context/SettingsContext";
```

## Step 3: Access the Translation Function `t()`

Inside your component function, call the hook to get the `t` function:

```javascript
const Customers = () => {
  const { t } = useSettings();
  
  // ... rest of your component logic
};
```

## Step 4: Replace Hardcoded Text

Find all hardcoded text in your JSX (titles, buttons, table headers, placeholders, alerts) and replace them with `t("pageName.keyName")`.

**Before:**
```jsx
<h1>Customers Management</h1>
<button>Add Customer</button>
<input placeholder="Search by name..." />
```

**After:**
```jsx
<h1>{t("customers.title")}</h1>
<button>{t("customers.addCustomer")}</button>
<input placeholder={t("customers.searchPlaceholder")} />
```

## Step 5: Handle Missing Translations Safely

If you are passing translations down to components or if a key might be missing temporarily, you can use the JavaScript logical OR operator (`||`) to provide a fallback string:

```jsx
<button>{t("customers.save") || "Save Changes"}</button>
```

## Summary Checklist
- [ ] Added keys to `en` object in `translations.js`.
- [ ] Added identical keys to `am` object in `translations.js`.
- [ ] Imported `useSettings` in the component.
- [ ] Destructured `const { t } = useSettings();`.
- [ ] Replaced all static text with `{t('section.key')}`.
