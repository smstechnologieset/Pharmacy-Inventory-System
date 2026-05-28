Mock Data Still Used
- [Header.jsx](</c:/SMS/Pharmacy-Inventory-System/src/components/Header.jsx>): notifications come from src/data/mockData.js. These are not real low-stock, expiry, or sale alerts.
- [Expiration.jsx](</c:/SMS/Pharmacy-Inventory-System/src/pages/Expiration.jsx>): fully uses medicines as initialMedicines from mock data. Its remove/dispose actions only update local React state, not Firestore.
- [Sidebar.jsx](</c:/SMS/Pharmacy-Inventory-System/src/components/Sidebar.jsx>): imports roles from mockData.js. This is not fake business data, but role constants should be moved to a dedicated file like src/constants/roles.js.
- [mockData.js](</c:/SMS/Pharmacy-Inventory-System/src/data/mockData.js>): still contains mock users, medicines, sales, suppliers, notifications, dashboard stats, and chart values. Most are now legacy/demo data and should be removed once roles/notifications are replaced.

Features That Do Not Make Sense Yet
- Inventory and Medicines duplicate each other. Both create/update/delete documents in the same medicines collection. “Inventory & Stock” should not create a new medicine product; it should receive stock for an existing medicine/batch.
- Stock has no movement history. Sales directly subtract stock from medicines. There is no record of why stock changed: sale, purchase, disposal, correction, return.
- Expiration page is disconnected. Reports calculate expiration from Firestore, but the main Expiration page uses mock data. This will confuse users.
- Supplier integration is incomplete. Medicine creation stores supplierId and supplierName, but updateMedicine() does not persist those fields. Reports and Inventory also sometimes display med.supplier, while Medicine stores supplierName.
- Sales checkout is not transaction-safe. Stock is reduced with separate updates. Two users could sell the same stock at the same time and oversell.
- Invoice numbers are random. Math.random() can collide. Use a sequence/counter or readable Firestore-generated invoice number.
- Payment reports expect Cash/CBE/Telebirr, but POS only records Cash. Add payment method selection at checkout.
- “On Hold” sales tab exists but has no behavior. Either implement held carts or remove it.
- Profit is estimated at fixed 30%. Useful for demo, not useful for a real pharmacy. Add cost price/purchase price per batch.
- Staff delete only deletes Firestore profile, not Firebase Auth user. The login account remains active unless handled by backend/Admin SDK.
- Settings page is mostly visual. Change password, 2FA, session management, profile photo, language, currency, thresholds, and support portal are not wired.
- Role access is only hidden in sidebar. Users can likely access routes directly by URL because App.jsx only checks login, not allowed roles.
- Low-stock thresholds are inconsistent. Dashboard uses 10, Inventory uses 50, Settings shows 50 but does not save.
- Date/invoice field names are inconsistent. Some code uses invoiceId, others invoiceNumber. Some use date, others createdAt.

Must Add / Change To Make It Useful
- Add a real stock movement system:
  - purchase_received
  - sale
  - adjustment
  - expired_disposal
  - return
- Split product data from batch/stock data:
  - medicines: name, category, barcode, dosage, default price
  - stockBatches: medicineId, supplierId, batchNo, expiry, quantity, costPrice, sellingPrice
- Add purchase/stock receiving from suppliers. Current supplier module has no operational use beyond contact storage.
- Add payment method selection in POS.
- Add returns/refunds/cancel sale flow that restores stock correctly.
- Add real notifications from Firestore/computed data:
  - low stock
  - expired stock
  - expiring soon
  - out of stock
- Add route-level role guards, not only sidebar filtering.
- Add Firestore transactions for checkout stock deduction.
- Add real settings persistence, especially low-stock threshold and expiry warning window.
- Add audit trail for staff actions: who sold, who updated stock, who disposed expired items.
- Add proper Firebase Admin/backend function for staff account creation/deletion/reset password. Client-side account administration is limited and not secure enough for production.

How The Modules Should Integrate
Recommended operational flow:

1. Suppliers
   Store supplier contact details.

2. Medicines
   Store product master data only: medicine name, category, dosage, barcode, description.

3. Inventory / Stock Receiving
   Select an existing medicine and supplier, then create a stock batch:
   medicineId, supplierId, batchNo, expiry, quantity, costPrice, sellingPrice.

4. Point of Sale
   Sell from available non-expired batches. On checkout:
   - create sale record
   - create sale items
   - reduce batch quantity using Firestore transaction
   - create stock movement records

5. Expiration
   Read real stock batches from Firestore. Mark expired batches as disposed by creating a stockMovement and setting batch quantity/status accordingly.

6. Dashboard / Reports
   Stop calculating from mixed medicine fields. Use:
   - sales for revenue
   - sale items for top products
   - stock batches for stock/expiry
   - stock movements for audit/history
   - cost price for real profit

7. Notifications
   Generate from live data:
   - stockBatches.quantity <= settings.lowStockThreshold
   - expiry <= today + settings.expiryWarningDays
   - expiry < today
   - quantity === 0

Priority Order
1. Replace Expiration.jsx mock data with Firestore medicines/batches.
2. Fix Medicine supplier update persistence.
3. Redesign Inventory so it updates/receives stock instead of duplicating Medicine creation.
4. Add payment method to Sales.
5. Add Firestore transaction for checkout.
6. Add route-level role guards.
7. Add stock movements.
8. Add real settings and notifications.
9. Replace estimated profit with cost-price-based profit.
