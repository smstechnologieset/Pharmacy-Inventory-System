export const roles = {
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  MANAGER: 'manager'
};

export const users = [
  { id: 1, name: 'Anantha Krishnan', email: 'admin@pharmacy.com', role: roles.ADMIN, avatar: 'https://i.pravatar.cc/150?u=1', status: 'Active' },
  { id: 2, name: 'Sarah Jones', email: 'sarah@pharmacy.com', role: roles.PHARMACIST, avatar: 'https://i.pravatar.cc/150?u=2', status: 'Active' },
  { id: 3, name: 'Mike Miller', email: 'mike@pharmacy.com', role: roles.MANAGER, avatar: 'https://i.pravatar.cc/150?u=3', status: 'Inactive' },
  { id: 4, name: 'Abebe Bikila', email: 'abebe@pharmacy.com', role: roles.PHARMACIST, avatar: 'https://i.pravatar.cc/150?u=4', status: 'Active' },
  { id: 5, name: 'Tegene Kassahun', email: 'tegene@pharmacy.com', role: roles.MANAGER, avatar: 'https://i.pravatar.cc/150?u=5', status: 'Active' },
];

export const notifications = [
  { id: 1, title: 'Low Stock Alert', message: 'Amoxicillin is below 50 units.', time: '5 mins ago', type: 'warning' },
  { id: 2, title: 'Expiry Warning', message: 'Insulin Injection expiring in 30 days.', time: '1 hour ago', type: 'error' },
  { id: 3, title: 'New Order', message: 'Order #8847 has been processed.', time: '3 hours ago', type: 'success' },
];

export const medicines = [
  { id: 1, name: 'Paracetamol', category: 'Tablets', stock: 500, price: 5.50, supplier: 'PharmaCorp', batch: 'P152/1', expiry: '2025-12-01', status: 'In Stock', description: 'Pain reliever and fever reducer.', dosage: '500mg', instructions: 'Take 1 tablet every 6 hours.' },
  { id: 2, name: 'Amoxicillin', category: 'Capsules', stock: 50, price: 12.00, supplier: 'MediSupply', batch: 'A102/2', expiry: '2024-05-15', status: 'Low Stock', description: 'Antibiotic used to treat various bacterial infections.', dosage: '250mg', instructions: 'Take 1 capsule twice a day after meals.' },
  { id: 3, name: 'Cough Syrup', category: 'Syrups', stock: 120, price: 8.75, supplier: 'HealthLine', batch: 'S088/1', expiry: '2025-08-20', status: 'In Stock', description: 'Soothing syrup for respiratory relief.', dosage: '10ml', instructions: 'Take 10ml three times daily.' },
  { id: 4, name: 'Insulin Injection', category: 'Injections', stock: 15, price: 45.00, supplier: 'LifeCare', batch: 'I992/3', expiry: '2024-04-10', status: 'Low Stock', description: 'Metabolic hormone for diabetes management.', dosage: '10 UI', instructions: 'Administered sub-cutaneously.' },
  { id: 5, name: 'Aspirin', category: 'Tablets', stock: 0, price: 4.20, supplier: 'PharmaCorp', batch: 'B441/1', expiry: '2023-11-30', status: 'Out of Stock', description: 'NSAID used to reduce pain, fever, or inflammation.', dosage: '300mg', instructions: 'Take with food.' },
  { id: 6, name: 'Clopilet 75MG TAB', category: 'Tablets', stock: 250, price: 15.00, supplier: 'MediSupply', batch: 'P152/1', expiry: '2025-01-12', status: 'In Stock', description: 'Antiplatelet medication that prevents blood clots.', dosage: '75mg', instructions: 'One tablet daily.' },
  { id: 7, name: 'Tonact -40MG TAB', category: 'Tablets', stock: 180, price: 20.00, supplier: 'HealthLine', batch: 'P152/1', expiry: '2025-01-12', status: 'In Stock', description: 'Statins used to lower cholesterol level.', dosage: '40mg', instructions: 'Take at night before bed.' },
  { id: 8, name: 'DC Examination Gloves', category: 'Supplies', stock: 1200, price: 45.00, supplier: 'MediCare', batch: 'P152/1', expiry: '2026-06-01', status: 'In Stock', description: 'Latex-free sterile gloves for clinical use.', dosage: 'N/A', instructions: 'Single use only.' }
];

export const salesData = [
  { id: '8844', item: 'DC Examination Gloves', date: '12/1/22', quantity: 25, batch: 'P152/1', status: 'Delivered', payment: 'Mastercard', amount: 710 },
  { id: '8845', item: 'Clopilet 75MG TAB', date: '12/1/22', quantity: 10, batch: 'P152/1', status: 'Pending', payment: 'Visacard', amount: 120 },
  { id: '8846', item: 'Tonact -40MG TAB', date: '12/1/22', quantity: 60, batch: 'P152/1', status: 'Cancelled', payment: 'Cash', amount: 500 },
  { id: '8847', item: 'Paracetamol', date: '13/1/22', quantity: 5, batch: 'P152/1', status: 'Delivered', payment: 'Cash', amount: 27.5 },
];

export const dashboardStats = {
  totalProfit: 'ETB 1,503,748',
  inventoryStock: '1,432',
  outOfStock: '389',
  expired: '24',
  purchaseReport: {
    totalItems: 800,
    amountPaid: 'ETB 70,500',
    amountPending: 'ETB 30,000'
  }
};

export const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [45000, 75000, 55000, 80000, 60000, 85000]
};

export const inventoryChartData = {
  labels: ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Antibiotics']
};

export const suppliers = [
  { id: 1, name: 'PharmaCorp', contact: 'John Doe', phone: '+1234567890', email: 'john@pharmacorp.com', address: 'Addis Ababa, Ethiopia', medicines: ['Paracetamol', 'Aspirin'] },
  { id: 2, name: 'MediSupply', contact: 'Jane Smith', phone: '+0987654321', email: 'jane@medisupply.com', address: 'Bole, Addis Ababa', medicines: ['Amoxicillin', 'Clopilet'] },
  { id: 3, name: 'HealthLine', contact: 'Alemayehu T.', phone: '+2519112233', email: 'alem@healthline.et', address: 'Lideta, Addis Ababa', medicines: ['Cough Syrup', 'Tonact'] },
  { id: 4, name: 'LifeCare', contact: 'Zewditu B.', phone: '+2511155667', email: 'zewd@lifecare.et', address: 'Kazanchis, Addis Ababa', medicines: ['Insulin Injection'] },
];
