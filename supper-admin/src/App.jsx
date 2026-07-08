import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Building2, ShieldCheck, CreditCard, Users, BarChart3, FileText,
  Megaphone, ToggleLeft, Settings, Search, Bell, User, ChevronDown, LogOut,
  Eye, Ban, Check, X, MoreHorizontal, Filter, Calendar, TrendingUp, TrendingDown,
  Activity, DollarSign, UserCheck, AlertTriangle, Clock, EyeOff, Key, Edit,
  Trash2, Download, Upload, ChevronRight, Menu, X as XIcon, ArrowUpRight,
  ArrowDownRight, Package, FileCheck, FileX, HelpCircle, Phone, Mail, Globe,
  Lock, Shield, Zap, Target, Layers, RefreshCw, Send, Plus, Minus, Search as SearchIcon
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#0f766e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

const mockPharmacies = [
  { id: 1, name: 'Addis Med Pharmacy', owner: 'Abebe Kebede', location: 'Addis Ababa', plan: 'Business', status: 'Active', branches: 3, users: 12, registered: '2025-01-15', revenue: 14900 },
  { id: 2, name: 'Gondar Health Pharmacy', owner: 'Sara Tadesse', location: 'Gondar', plan: 'Growth', status: 'Active', branches: 2, users: 8, registered: '2025-03-22', revenue: 9900 },
  { id: 3, name: 'Dire Dawa Care', owner: 'Mohammed Ali', location: 'Dire Dawa', plan: 'Starter', status: 'Pending', branches: 1, users: 4, registered: '2026-06-10', revenue: 0 },
  { id: 4, name: 'Hawassa Medical Store', owner: 'Tigist Bekele', location: 'Hawassa', plan: 'Growth', status: 'Suspended', branches: 1, users: 5, registered: '2025-07-08', revenue: 9900 },
  { id: 5, name: 'Bahir Dar Pharma', owner: 'Daniel Hailu', location: 'Bahir Dar', plan: 'Business', status: 'Active', branches: 4, users: 15, registered: '2025-02-14', revenue: 14900 },
  { id: 6, name: 'Jimma Health Plus', owner: 'Fatuma Omar', location: 'Jimma', plan: 'Starter', status: 'Active', branches: 1, users: 3, registered: '2025-11-03', revenue: 4900 },
  { id: 7, name: 'Mekelle Pharmacy Co', owner: 'Berhane Gebre', location: 'Mekelle', plan: 'Growth', status: 'Pending', branches: 2, users: 6, registered: '2026-05-20', revenue: 0 },
  { id: 8, name: 'Adama Medical Center', owner: 'Hana Worku', location: 'Adama', plan: 'Business', status: 'Active', branches: 3, users: 11, registered: '2025-04-18', revenue: 14900 },
];

const mockUsers = [
  { id: 1, name: 'Abebe Kebede', email: 'abebe@addismed.com', role: 'Pharmacy Owner', status: 'Active', lastLogin: '2026-07-07 14:32', created: '2025-01-15' },
  { id: 2, name: 'Sara Tadesse', email: 'sara@gondarhealth.com', role: 'Pharmacy Owner', status: 'Active', lastLogin: '2026-07-08 09:15', created: '2025-03-22' },
  { id: 3, name: 'Mohammed Ali', email: 'mohammed@direcare.com', role: 'Pharmacy Owner', status: 'Pending', lastLogin: '2026-06-10 11:20', created: '2026-06-10' },
  { id: 4, name: 'Tigist Bekele', email: 'tigist@hawassamed.com', role: 'Pharmacy Owner', status: 'Suspended', lastLogin: '2026-05-12 16:45', created: '2025-07-08' },
  { id: 5, name: 'Admin User', email: 'admin@pharmasys.et', role: 'Super Admin', status: 'Active', lastLogin: '2026-07-08 10:00', created: '2024-01-01' },
  { id: 6, name: 'Daniel Hailu', email: 'daniel@bahirpharma.com', role: 'Pharmacy Owner', status: 'Active', lastLogin: '2026-07-06 08:30', created: '2025-02-14' },
  { id: 7, name: 'Fatuma Omar', email: 'fatuma@jimmahealth.com', role: 'Pharmacy Owner', status: 'Active', lastLogin: '2026-07-07 17:10', created: '2025-11-03' },
  { id: 8, name: 'Berhane Gebre', email: 'berhane@mekellepharma.com', role: 'Pharmacy Owner', status: 'Pending', lastLogin: '2026-05-20 13:00', created: '2026-05-20' },
];

const mockPayments = [
  { id: 'TXN-001', pharmacy: 'Addis Med Pharmacy', amount: 14900, provider: 'Telebirr', status: 'Successful', date: '2026-07-01' },
  { id: 'TXN-002', pharmacy: 'Gondar Health Pharmacy', amount: 9900, provider: 'CBE Birr', status: 'Successful', date: '2026-07-02' },
  { id: 'TXN-003', pharmacy: 'Dire Dawa Care', amount: 4900, provider: 'Telebirr', status: 'Pending', date: '2026-07-05' },
  { id: 'TXN-004', pharmacy: 'Bahir Dar Pharma', amount: 14900, provider: 'Chapa', status: 'Successful', date: '2026-07-03' },
  { id: 'TXN-005', pharmacy: 'Hawassa Medical Store', amount: 9900, provider: 'Telebirr', status: 'Failed', date: '2026-06-28' },
  { id: 'TXN-006', pharmacy: 'Jimma Health Plus', amount: 4900, provider: 'CBE Birr', status: 'Refunded', date: '2026-06-15' },
  { id: 'TXN-007', pharmacy: 'Adama Medical Center', amount: 14900, provider: 'Chapa', status: 'Successful', date: '2026-07-04' },
  { id: 'TXN-008', pharmacy: 'Mekelle Pharmacy Co', amount: 9900, provider: 'Telebirr', status: 'Pending', date: '2026-07-06' },
];

const mockAuditLogs = [
  { id: 1, actor: 'Admin User', action: 'Suspended Pharmacy', target: 'Hawassa Medical Store', timestamp: '2026-07-07 16:45', details: 'Payment overdue for 30 days' },
  { id: 2, actor: 'Admin User', action: 'Approved Pharmacy', target: 'Jimma Health Plus', timestamp: '2026-07-06 11:20', details: 'All documents verified' },
  { id: 3, actor: 'System', action: 'Subscription Renewed', target: 'Addis Med Pharmacy', timestamp: '2026-07-01 00:00', details: 'Auto-renewal successful' },
  { id: 4, actor: 'Admin User', action: 'Impersonation Session', target: 'Gondar Health Pharmacy', timestamp: '2026-07-05 14:30', details: 'Support ticket #1234' },
  { id: 5, actor: 'Admin User', action: 'Updated Plan', target: 'Bahir Dar Pharma', timestamp: '2026-07-04 09:15', details: 'Upgraded from Growth to Business' },
  { id: 6, actor: 'System', action: 'Failed Login Attempt', target: 'Unknown', timestamp: '2026-07-03 22:10', details: 'Multiple failed attempts detected' },
];

const mockFeatureFlags = [
  { id: 1, name: 'AI Inventory Forecasting', description: 'Machine learning-based stock prediction', status: 'Enabled', plans: ['Business'], usage: '85%' },
  { id: 2, name: 'Multi-branch Sync', description: 'Real-time inventory across branches', status: 'Enabled', plans: ['Growth', 'Business'], usage: '92%' },
  { id: 3, name: 'Advanced Analytics', description: 'Custom reports and dashboards', status: 'Enabled', plans: ['Business'], usage: '78%' },
  { id: 4, name: 'SMS Notifications', description: 'Automated SMS alerts for low stock', status: 'Disabled', plans: ['Starter', 'Growth', 'Business'], usage: '0%' },
  { id: 5, name: 'API Access', description: 'REST API for third-party integrations', status: 'Enabled', plans: ['Business'], usage: '45%' },
  { id: 6, name: 'Bulk Import', description: 'CSV/Excel inventory import', status: 'Enabled', plans: ['Growth', 'Business'], usage: '67%' },
];

const mockAnnouncements = [
  { id: 1, title: 'Platform Maintenance Scheduled', message: 'Scheduled maintenance on July 15, 2026 from 2:00 AM - 4:00 AM EAT.', target: 'All Pharmacies', scheduled: '2026-07-10', status: 'Scheduled' },
  { id: 2, title: 'New Feature: AI Forecasting', message: 'Business plan users can now access AI-powered inventory forecasting.', target: 'Business Plan', scheduled: '2026-06-20', status: 'Sent' },
  { id: 3, title: 'Price Update Notice', message: 'Subscription prices will be updated effective August 1, 2026.', target: 'All Pharmacies', scheduled: '2026-07-01', status: 'Sent' },
];

const growthData = [
  { month: 'Jan', pharmacies: 12, users: 45 },
  { month: 'Feb', pharmacies: 15, users: 58 },
  { month: 'Mar', pharmacies: 18, users: 72 },
  { month: 'Apr', pharmacies: 22, users: 89 },
  { month: 'May', pharmacies: 28, users: 105 },
  { month: 'Jun', pharmacies: 35, users: 132 },
  { month: 'Jul', pharmacies: 42, users: 156 },
];

const revenueData = [
  { month: 'Jan', revenue: 58800 },
  { month: 'Feb', revenue: 74100 },
  { month: 'Mar', revenue: 89000 },
  { month: 'Apr', revenue: 108900 },
  { month: 'May', revenue: 138600 },
  { month: 'Jun', revenue: 173200 },
  { month: 'Jul', revenue: 208800 },
];

const planData = [
  { name: 'Starter', value: 15 },
  { name: 'Growth', value: 18 },
  { name: 'Business', value: 9 },
];

const planFeatures = {
  Starter: { price: 4900, users: 5, branches: 1, features: ['Basic Inventory', 'Sales Tracking', 'Low Stock Alerts', 'Email Support'] },
  Growth: { price: 9900, users: 15, branches: 3, features: ['Everything in Starter', 'Multi-branch', 'Advanced Reports', 'Priority Support', 'API Access'] },
  Business: { price: 14900, users: 50, branches: 10, features: ['Everything in Growth', 'AI Forecasting', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'White-label Option'] },
};

const verificationDocs = [
  { id: 1, pharmacy: 'Dire Dawa Care', type: 'Business License', status: 'Pending', uploaded: '2026-06-10', reviewer: null },
  { id: 2, pharmacy: 'Dire Dawa Care', type: 'Tax Registration', status: 'Pending', uploaded: '2026-06-10', reviewer: null },
  { id: 3, pharmacy: 'Dire Dawa Care', type: 'Pharmacist Certificate', status: 'Pending', uploaded: '2026-06-10', reviewer: null },
  { id: 4, pharmacy: 'Mekelle Pharmacy Co', type: 'Business License', status: 'Pending', uploaded: '2026-05-20', reviewer: null },
  { id: 5, pharmacy: 'Mekelle Pharmacy Co', type: 'Tax Registration', status: 'Approved', uploaded: '2026-05-20', reviewer: 'Admin User' },
  { id: 6, pharmacy: 'Mekelle Pharmacy Co', type: 'Pharmacist Certificate', status: 'Pending', uploaded: '2026-05-20', reviewer: null },
];

const recentActivity = [
  { id: 1, action: 'New pharmacy registered', pharmacy: 'Dire Dawa Care', time: '2 hours ago' },
  { id: 2, action: 'Subscription renewed', pharmacy: 'Addis Med Pharmacy', time: '5 hours ago' },
  { id: 3, action: 'Payment failed', pharmacy: 'Hawassa Medical Store', time: '1 day ago' },
  { id: 4, action: 'Pharmacy approved', pharmacy: 'Jimma Health Plus', time: '2 days ago' },
  { id: 5, action: 'Plan upgraded', pharmacy: 'Bahir Dar Pharma', time: '3 days ago' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Suspended: 'bg-red-50 text-red-700 border-red-200',
    Successful: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
    Refunded: 'bg-gray-50 text-gray-700 border-gray-200',
    Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    Sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Enabled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Disabled: 'bg-gray-50 text-gray-700 border-gray-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  );
};

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">{description}</p>
    {action}
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-24">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [pharmacyFilter, setPharmacyFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pharmacies', label: 'Pharmacy Management', icon: Building2 },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'features', label: 'Feature Flags', icon: ToggleLeft },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handlePageChange = (page) => {
    setLoading(true);
    setActivePage(page);
    setSelectedPharmacy(null);
    setTimeout(() => setLoading(false), 300);
    setMobileMenuOpen(false);
  };

  const filteredPharmacies = useMemo(() => {
    if (pharmacyFilter === 'All') return mockPharmacies;
    return mockPharmacies.filter(p => p.status === pharmacyFilter);
  }, [pharmacyFilter]);

  const filteredPayments = useMemo(() => {
    if (paymentFilter === 'All') return mockPayments;
    return mockPayments.filter(p => p.status === paymentFilter);
  }, [paymentFilter]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pharmacies</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">42</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Pharmacies</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">35</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-500">83% of total</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">MRR</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">ETB 208.8K</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-medium">+20.6%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">5</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-500">Requires action</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pharmacy Growth</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Area type="monotone" dataKey="pharmacies" stroke="#0f766e" fill="#0f766e" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4} dataKey="value">
                {planData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${v / 1000}K`} />
            <Tooltip formatter={(v) => `ETB ${v.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.action}</p>
                <p className="text-sm text-gray-500">{item.pharmacy}</p>
              </div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPharmacies = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered pharmacies on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={pharmacyFilter}
            onChange={(e) => setPharmacyFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Pharmacy</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Owner</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Location</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Plan</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Branches</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Users</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Registered</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{pharmacy.name}</td>
                  <td className="px-6 py-4 text-gray-600">{pharmacy.owner}</td>
                  <td className="px-6 py-4 text-gray-600">{pharmacy.location}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {pharmacy.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={pharmacy.status} /></td>
                  <td className="px-6 py-4 text-gray-600">{pharmacy.branches}</td>
                  <td className="px-6 py-4 text-gray-600">{pharmacy.users}</td>
                  <td className="px-6 py-4 text-gray-500">{pharmacy.registered}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedPharmacy(pharmacy); handlePageChange('pharmacy-detail'); }}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {pharmacy.status === 'Active' ? (
                        <button
                          onClick={() => { setConfirmAction(() => () => alert(`Suspended ${pharmacy.name}`)); setShowConfirmDialog(true); }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Suspend"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : pharmacy.status === 'Suspended' ? (
                        <button
                          onClick={() => { setConfirmAction(() => () => alert(`Activated ${pharmacy.name}`)); setShowConfirmDialog(true); }}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Activate"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPharmacyDetail = () => {
    if (!selectedPharmacy) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => handlePageChange('pharmacies')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedPharmacy.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Pharmacy details and management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Pharmacy Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPharmacy.owner}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPharmacy.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registration Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPharmacy.registered}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1"><StatusBadge status={selectedPharmacy.status} /></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Subscription Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Current Plan</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPharmacy.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Monthly Fee</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">ETB {planFeatures[selectedPharmacy.plan].price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Users</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPharmacy.users} / {planFeatures[selectedPharmacy.plan].users}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Branches</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPharmacy.branches} / {planFeatures[selectedPharmacy.plan].branches}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Verification Documents</h3>
              <div className="space-y-3">
                {['Business License', 'Tax Registration', 'Pharmacist Certificate'].map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-gray-900">{doc}</span>
                    </div>
                    <StatusBadge status="Approved" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                  <Check className="w-4 h-4" /> Approve Pharmacy
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <X className="w-4 h-4" /> Reject Pharmacy
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50">
                  <Ban className="w-4 h-4" /> Suspend Pharmacy
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50">
                  <Eye className="w-4 h-4" /> Impersonate Pharmacy
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Storage Used</span>
                    <span className="text-gray-900">68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">API Calls</span>
                    <span className="text-gray-900">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">User Limit</span>
                    <span className="text-gray-900">{Math.round((selectedPharmacy.users / planFeatures[selectedPharmacy.plan].users) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${(selectedPharmacy.users / planFeatures[selectedPharmacy.plan].users) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVerification = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve pharmacy registration documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">5</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Approved This Month</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">12</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">3</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Document Review Queue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Pharmacy</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Document Type</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Uploaded</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {verificationDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{doc.pharmacy}</td>
                  <td className="px-6 py-4 text-gray-600">{doc.type}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.uploaded}</td>
                  <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                  <td className="px-6 py-4">
                    {doc.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Request Resubmission">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Reviewed by {doc.reviewer}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage plans and active subscriptions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(planFeatures).map(([plan, details]) => (
          <div key={plan} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan}</h3>
              <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Edit</button>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">ETB {details.price.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mb-4">per month</p>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">Max Users: <span className="font-medium">{details.users}</span></p>
              <p className="text-sm text-gray-600">Max Branches: <span className="font-medium">{details.branches}</span></p>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Features</p>
              <ul className="space-y-1.5">
                {details.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Active Subscriptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Pharmacy</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Plan</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Renewal Date</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Payment</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockPharmacies.filter(p => p.status === 'Active').map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">{p.plan}</td>
                  <td className="px-6 py-4"><StatusBadge status="Active" /></td>
                  <td className="px-6 py-4 text-gray-500">2026-08-01</td>
                  <td className="px-6 py-4 text-gray-900">ETB {p.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4"><StatusBadge status="Successful" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-emerald-600 hover:underline">Upgrade</button>
                      <button className="text-xs text-gray-500 hover:underline">Downgrade</button>
                      <button className="text-xs text-red-600 hover:underline">Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Transaction history and revenue tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Status</option>
            <option value="Successful">Successful</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">ETB 851.7K</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Successful</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">ETB 692.5K</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">ETB 14.8K</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Failed/Refunded</p>
          <p className="text-2xl font-bold text-red-600 mt-1">ETB 14.4K</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${v / 1000}K`} />
            <Tooltip formatter={(v) => `ETB ${v.toLocaleString()}`} />
            <Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} dot={{ fill: '#0f766e' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Transaction ID</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Pharmacy</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Provider</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{p.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.pharmacy}</td>
                  <td className="px-6 py-4 text-gray-900">ETB {p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{p.provider}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-gray-500">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Platform users and account management</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All Users</h3>
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Role</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Last Login</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Created</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-gray-600">{user.role}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-gray-500">{user.created}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="View Activity">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded" title="Reset Password">
                        <Key className="w-4 h-4" />
                      </button>
                      {user.status === 'Active' && (
                        <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Disable Account">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">SaaS business metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">MRR</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">ETB 208.8K</p>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-medium">+20.6%</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Customer Growth</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">+7</p>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-medium">+16.7%</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Churn Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">2.4%</p>
          <div className="flex items-center mt-2 text-sm">
            <ArrowDownRight className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-medium">-0.8%</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Active Users</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-medium">+24</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Growth</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip formatter={(v) => `ETB ${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="#0f766e" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">New Pharmacies</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="pharmacies" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Plan Adoption</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4} dataKey="value">
                {planData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">User Activity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Feature Usage</h3>
        <div className="space-y-4">
          {mockFeatureFlags.filter(f => f.status === 'Enabled').map((f) => (
            <div key={f.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{f.name}</span>
                <span className="text-gray-500">{f.usage}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: f.usage }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Security and activity tracking</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Actor</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Action</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Target</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Timestamp</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{log.actor}</td>
                  <td className="px-6 py-4 text-gray-600">{log.action}</td>
                  <td className="px-6 py-4 text-gray-600">{log.target}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{log.timestamp}</td>
                  <td className="px-6 py-4 text-gray-500">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Send platform-wide messages to pharmacies</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Create Announcement
        </button>
      </div>

      <div className="space-y-4">
        {mockAnnouncements.map((a) => (
          <div key={a.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{a.message}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
              <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {a.target}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {a.scheduled}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-sm text-gray-500 mt-1">Manage feature availability across plans</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {mockFeatureFlags.map((f) => (
            <div key={f.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{f.name}</h3>
                  <StatusBadge status={f.status} />
                </div>
                <p className="text-sm text-gray-500">{f.description}</p>
                <p className="text-xs text-gray-400 mt-1">Available for: {f.plans.join(', ')} | Usage: {f.usage}</p>
              </div>
              <div className="flex items-center gap-3 ml-6">
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.status === 'Enabled' ? 'bg-emerald-600' : 'bg-gray-300'}`}
                  onClick={() => alert(`Toggle ${f.name}`)}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.status === 'Enabled' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <button className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                <input type="text" defaultValue="PharmaSys Ethiopia" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input type="email" defaultValue="support@pharmasys.et" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>ETB - Ethiopian Birr</option>
                  <option>USD - US Dollar</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Email Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Welcome Emails</p>
                  <p className="text-xs text-gray-500">Send welcome email on registration</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Receipts</p>
                  <p className="text-xs text-gray-500">Send receipt after successful payment</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Renewal Reminders</p>
                  <p className="text-xs text-gray-500">Notify 7 days before renewal</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Require 2FA for all admin accounts</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Session Timeout</p>
                  <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
                </div>
                <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Admin Profile</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Shield className="w-4 h-4" /> Security Settings
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Integrations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Chapa</span>
                </div>
                <StatusBadge status="Enabled" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Telebirr</span>
                </div>
                <StatusBadge status="Enabled" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">SMS Gateway</span>
                </div>
                <StatusBadge status="Disabled" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return <LoadingState />;
    switch (activePage) {
      case 'dashboard': return renderDashboard();
      case 'pharmacies': return renderPharmacies();
      case 'pharmacy-detail': return renderPharmacyDetail();
      case 'verification': return renderVerification();
      case 'subscriptions': return renderSubscriptions();
      case 'payments': return renderPayments();
      case 'users': return renderUsers();
      case 'analytics': return renderAnalytics();
      case 'audit': return renderAudit();
      case 'announcements': return renderAnnouncements();
      case 'features': return renderFeatures();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center h-16 border-b border-gray-200 ${sidebarOpen ? 'px-6' : 'px-4 justify-center'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && <span className="text-lg font-bold text-gray-900">PharmaSys</span>}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id || (item.id === 'pharmacies' && activePage === 'pharmacy-detail');
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handlePageChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${!sidebarOpen ? 'justify-center' : ''}`}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : ''}`} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={`border-t border-gray-200 p-3 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden sm:block relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">New pharmacy registration pending</p>
                      <p className="text-xs text-gray-500 mt-1">Dire Dawa Care</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">Payment failed</p>
                      <p className="text-xs text-gray-500 mt-1">Hawassa Medical Store</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">Subscription renewal due</p>
                      <p className="text-xs text-gray-500 mt-1">3 pharmacies</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">admin@pharmasys.et</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => { confirmAction?.(); setShowConfirmDialog(false); }}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action?"
      />
    </div>
  );
}
