import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Building2, ShieldCheck, CreditCard, Users, BarChart3, FileText,
  Megaphone, ToggleLeft, Settings, Search, Bell, User, ChevronDown, LogOut,
  Eye, Ban, Check, X, MoreHorizontal, Filter, Calendar, TrendingUp, TrendingDown,
  Activity, DollarSign, UserCheck, AlertTriangle, Clock, EyeOff, Key, Edit,
  Trash2, Download, Upload, ChevronRight, Menu, X as XIcon, ArrowUpRight,
  ArrowRight,
  ArrowDownRight, Package, FileCheck, FileX, HelpCircle, Phone, Mail, Globe,
  Lock, Shield, Zap, Target, Layers, RefreshCw, Send, Plus, Minus, Search as SearchIcon,
  ShieldPlus
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ─── Design Tokens (Consistent with Client App) ───────────────────────────────
const COLORS = ['#0d9488', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── Mock Data (Unchanged) ────────────────────────────────────────────────────
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

// ─── Shared UI Components ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Suspended: 'bg-red-50 text-red-700 border-red-200',
    Successful: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
    Refunded: 'bg-slate-50 text-slate-700 border-slate-200',
    Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    Sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Enabled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Disabled: 'bg-slate-50 text-slate-700 border-slate-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      {status}
    </span>
  );
};

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">{description}</p>
    {action}
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-24">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

// ─── Auth Page Component ──────────────────────────────────────────────────────
const AdminLoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === 'admin@pharmasys.et' && password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid credentials. Use admin@pharmasys.et / admin123');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:flex-[1.2] bg-gradient-to-br from-teal-600 to-emerald-600 flex-col justify-center p-16 xl:p-24 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-4 mb-12 relative">
          <div className="bg-white/20 p-3 rounded-2xl shadow-lg backdrop-blur-sm">
            <ShieldPlus size={40} />
          </div>
          <span className="text-4xl font-extrabold tracking-tight">PharmaSys</span>
        </div>

        <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight mb-8 relative">
          Platform <br /> Management <br /> Console.
        </h1>

        <p className="text-xl opacity-90 max-w-md leading-relaxed relative">
          Monitor, manage, and scale your pharmacy SaaS platform from a single unified dashboard.
        </p>

        <div className="mt-16 flex gap-6 relative">
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="font-bold text-2xl">42</div>
            <div className="text-sm opacity-80">Active Pharmacies</div>
          </div>
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="font-bold text-2xl">ETB 208K</div>
            <div className="text-sm opacity-80">Monthly Revenue</div>
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <ShieldPlus className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900">PharmaSys Admin</span>
          </div>

          <div className="mb-10">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Admin Sign In</h1>
            <p className="text-slate-500 text-sm">Access the platform management console.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 mb-5 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-red-800 text-sm leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 pl-12 pr-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none text-sm transition-all focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
                  placeholder="admin@pharmasys.et"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3.5 pl-12 pr-12 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none text-sm transition-all focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-base font-bold rounded-xl mt-4 flex items-center justify-center gap-2 bg-teal-600 text-white border-none transition-all hover:bg-teal-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20"
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              Demo credentials: admin@pharmasys.et / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main App Component ───────────────────────────────────────────────────────
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const filteredPharmacies = useMemo(() => {
    if (pharmacyFilter === 'All') return mockPharmacies;
    return mockPharmacies.filter(p => p.status === pharmacyFilter);
  }, [pharmacyFilter]);

  const filteredPayments = useMemo(() => {
    if (paymentFilter === 'All') return mockPayments;
    return mockPayments.filter(p => p.status === paymentFilter);
  }, [paymentFilter]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pharmacies', label: 'Pharmacies', icon: Building2 },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'users', label: 'Users', icon: Users },
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
    setShowNotifications(false);
    setShowProfileMenu(false);
    setTimeout(() => setLoading(false), 300);
    setMobileMenuOpen(false);
  };


  // ─── Page Renderers ─────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pharmacies', value: '42', icon: Building2, color: 'bg-teal-50 text-teal-600', trend: '+12%', trendUp: true },
          { label: 'Active Pharmacies', value: '35', icon: Check, color: 'bg-blue-50 text-blue-600', sub: '83% of total' },
          { label: 'MRR', value: 'ETB 208.8K', icon: DollarSign, color: 'bg-amber-50 text-amber-600', trend: '+20.6%', trendUp: true },
          { label: 'Pending Approvals', value: '5', icon: Clock, color: 'bg-red-50 text-red-600', sub: 'Requires action' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              {stat.trend && (
                <>
                  {stat.trendUp ? <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" /> : <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />}
                  <span className={`font-semibold ${stat.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>{stat.trend}</span>
                  <span className="text-slate-400 ml-1">vs last month</span>
                </>
              )}
              {stat.sub && <span className="text-slate-400">{stat.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Pharmacy Growth</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="pharmacies" stroke="#0d9488" fill="#0d9488" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Subscription Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4} dataKey="value">
                {planData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Analytics</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}K`} />
            <Tooltip formatter={(v) => `ETB ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {recentActivity.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                <p className="text-sm text-slate-500">{item.pharmacy}</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">{item.time}</span>
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all registered pharmacies on the platform</p>
        </div>
        <select
          value={pharmacyFilter}
          onChange={(e) => setPharmacyFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white transition-all"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Pharmacy', 'Owner', 'Location', 'Plan', 'Status', 'Branches', 'Users', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{pharmacy.name}</td>
                  <td className="px-6 py-4 text-slate-600">{pharmacy.owner}</td>
                  <td className="px-6 py-4 text-slate-600">{pharmacy.location}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {pharmacy.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={pharmacy.status} /></td>
                  <td className="px-6 py-4 text-slate-600">{pharmacy.branches}</td>
                  <td className="px-6 py-4 text-slate-600">{pharmacy.users}</td>
                  <td className="px-6 py-4 text-slate-500">{pharmacy.registered}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedPharmacy(pharmacy); handlePageChange('pharmacy-detail'); }}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {pharmacy.status === 'Active' && (
                        <button
                          onClick={() => { setConfirmAction(() => () => alert(`Suspended ${pharmacy.name}`)); setShowConfirmDialog(true); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Suspend"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      {pharmacy.status === 'Suspended' && (
                        <button
                          onClick={() => { setConfirmAction(() => () => alert(`Activated ${pharmacy.name}`)); setShowConfirmDialog(true); }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Activate"
                        >
                          <Check className="w-4 h-4" />
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

  const renderPharmacyDetail = () => {
    if (!selectedPharmacy) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => handlePageChange('pharmacies')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5 rotate-180 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPharmacy.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Pharmacy details and management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[
              { title: 'Pharmacy Profile', items: [
                { label: 'Owner', value: selectedPharmacy.owner },
                { label: 'Location', value: selectedPharmacy.location },
                { label: 'Registration Date', value: selectedPharmacy.registered },
                { label: 'Status', value: <StatusBadge status={selectedPharmacy.status} /> },
              ]},
              { title: 'Subscription Information', items: [
                { label: 'Current Plan', value: selectedPharmacy.plan },
                { label: 'Monthly Fee', value: `ETB ${planFeatures[selectedPharmacy.plan].price.toLocaleString()}` },
                { label: 'Users', value: `${selectedPharmacy.users} / ${planFeatures[selectedPharmacy.plan].users}` },
                { label: 'Branches', value: `${selectedPharmacy.branches} / ${planFeatures[selectedPharmacy.plan].branches}` },
              ]},
            ].map((section, si) => (
              <div key={si} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">{section.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {section.items.map((item, ii) => (
                    <div key={ii}>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                      <div className="text-sm font-semibold text-slate-900 mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Verification Documents</h3>
              <div className="space-y-3">
                {['Business License', 'Tax Registration', 'Pharmacist Certificate'].map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-slate-900">{doc}</span>
                    </div>
                    <StatusBadge status="Approved" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]">
                  <Check className="w-4 h-4" /> Approve Pharmacy
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                  <X className="w-4 h-4" /> Reject Pharmacy
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all active:scale-[0.98]">
                  <Ban className="w-4 h-4" /> Suspend Pharmacy
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-all active:scale-[0.98]">
                  <Eye className="w-4 h-4" /> Impersonate Pharmacy
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Usage Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Storage Used', pct: 68, color: 'bg-teal-600' },
                  { label: 'API Calls', pct: 45, color: 'bg-blue-600' },
                  { label: 'User Limit', pct: Math.round((selectedPharmacy.users / planFeatures[selectedPharmacy.plan].users) * 100), color: 'bg-amber-600' },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500 font-medium">{m.label}</span>
                      <span className="text-slate-900 font-bold">{m.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${m.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${m.pct}%` }}></div>
                    </div>
                  </div>
                ))}
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verification Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve pharmacy registration documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: '5', color: 'text-amber-600' },
          { label: 'Approved This Month', value: '12', color: 'text-emerald-600' },
          { label: 'Rejected', value: '3', color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Document Review Queue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Pharmacy', 'Document Type', 'Uploaded', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {verificationDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{doc.pharmacy}</td>
                  <td className="px-6 py-4 text-slate-600">{doc.type}</td>
                  <td className="px-6 py-4 text-slate-500">{doc.uploaded}</td>
                  <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                  <td className="px-6 py-4">
                    {doc.status === 'Pending' ? (
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve"><Check className="w-4 h-4" /></button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Reject"><X className="w-4 h-4" /></button>
                        <button className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Request Resubmission"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Reviewed by {doc.reviewer}</span>
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage plans and active subscriptions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(planFeatures).map(([plan, details]) => (
          <div key={plan} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{plan}</h3>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-semibold">Edit</button>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">ETB {details.price.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mb-4">per month</p>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-slate-600">Max Users: <span className="font-bold">{details.users}</span></p>
              <p className="text-sm text-slate-600">Max Branches: <span className="font-bold">{details.branches}</span></p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Features</p>
              <ul className="space-y-1.5">
                {details.features.map((f, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Active Subscriptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Pharmacy', 'Plan', 'Status', 'Renewal Date', 'Amount', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockPharmacies.filter(p => p.status === 'Active').map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600">{p.plan}</td>
                  <td className="px-6 py-4"><StatusBadge status="Active" /></td>
                  <td className="px-6 py-4 text-slate-500">2026-08-01</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">ETB {p.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4"><StatusBadge status="Successful" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button className="text-xs font-semibold text-teal-600 hover:underline">Upgrade</button>
                      <button className="text-xs font-semibold text-slate-500 hover:underline">Downgrade</button>
                      <button className="text-xs font-semibold text-red-600 hover:underline">Cancel</button>
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Transaction history and revenue tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white transition-all"
          >
            <option value="All">All Status</option>
            <option value="Successful">Successful</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: 'ETB 851.7K', color: 'text-slate-900' },
          { label: 'Successful', value: 'ETB 692.5K', color: 'text-emerald-600' },
          { label: 'Pending', value: 'ETB 14.8K', color: 'text-amber-600' },
          { label: 'Failed/Refunded', value: 'ETB 14.4K', color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}K`} />
            <Tooltip formatter={(v) => `ETB ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Transaction ID', 'Pharmacy', 'Amount', 'Provider', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{p.pharmacy}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">ETB {p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{p.provider}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-slate-500">{p.date}</td>
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Platform users and account management</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">All Users</h3>
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 w-64 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-slate-600">{user.role}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-slate-500">{user.created}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="View Activity"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Reset Password"><Key className="w-4 h-4" /></button>
                      {user.status === 'Active' && (
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Disable Account"><Ban className="w-4 h-4" /></button>
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">SaaS business metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: 'ETB 208.8K', trend: '+20.6%', up: true },
          { label: 'Customer Growth', value: '+7', trend: '+16.7%', up: true },
          { label: 'Churn Rate', value: '2.4%', trend: '-0.8%', up: true },
          { label: 'Active Users', value: '156', trend: '+24', up: true },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
            <div className="flex items-center mt-2 text-sm">
              {s.up ? <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" /> : <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />}
              <span className="text-emerald-600 font-semibold">{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Growth</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip formatter={(v) => `ETB ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="#0d9488" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">New Pharmacies</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="pharmacies" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Plan Adoption</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4} dataKey="value">
                {planData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index]} />))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">User Activity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Feature Usage</h3>
        <div className="space-y-4">
          {mockFeatureFlags.filter(f => f.status === 'Enabled').map((f) => (
            <div key={f.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 font-semibold">{f.name}</span>
                <span className="text-slate-500 font-medium">{f.usage}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full transition-all duration-500" style={{ width: f.usage }}></div>
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Security and activity tracking</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Actor', 'Action', 'Target', 'Timestamp', 'Details'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{log.actor}</td>
                  <td className="px-6 py-4 text-slate-600">{log.action}</td>
                  <td className="px-6 py-4 text-slate-600">{log.target}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{log.timestamp}</td>
                  <td className="px-6 py-4 text-slate-500">{log.details}</td>
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">Send platform-wide messages to pharmacies</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Create Announcement
        </button>
      </div>

      <div className="space-y-4">
        {mockAnnouncements.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{a.message}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mt-4 pt-4 border-t border-slate-100">
              <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> {a.target}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {a.scheduled}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Feature Flags</h1>
        <p className="text-sm text-slate-500 mt-1">Manage feature availability across plans</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {mockFeatureFlags.map((f) => (
            <div key={f.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
                  <StatusBadge status={f.status} />
                </div>
                <p className="text-sm text-slate-500">{f.description}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Available for: {f.plans.join(', ')} · Usage: {f.usage}</p>
              </div>
              <div className="flex items-center gap-3 ml-6">
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${f.status === 'Enabled' ? 'bg-teal-600' : 'bg-slate-300'}`}
                  onClick={() => alert(`Toggle ${f.name}`)}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.status === 'Enabled' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Platform configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[
            { title: 'Platform Configuration', fields: [
              { label: 'Platform Name', type: 'text', defaultValue: 'PharmaSys Ethiopia' },
              { label: 'Support Email', type: 'email', defaultValue: 'support@pharmasys.et' },
              { label: 'Default Currency', type: 'select', options: ['ETB - Ethiopian Birr', 'USD - US Dollar'] },
            ]},
            { title: 'Email Settings', toggles: [
              { label: 'Welcome Emails', desc: 'Send welcome email on registration', on: true },
              { label: 'Payment Receipts', desc: 'Send receipt after successful payment', on: true },
              { label: 'Renewal Reminders', desc: 'Notify 7 days before renewal', on: true },
            ]},
            { title: 'Security Settings', items: [
              { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts', type: 'toggle', on: true },
              { label: 'Session Timeout', desc: 'Auto-logout after inactivity', type: 'select', options: ['30 minutes', '1 hour', '4 hours'] },
            ]},
          ].map((section, si) => (
            <div key={si} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">{section.title}</h3>
              <div className="space-y-4">
                {section.fields?.map((field, fi) => (
                  <div key={fi}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}</label>
                    {field.type === 'select' ? (
                      <select className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all">
                        {field.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={field.type} defaultValue={field.defaultValue} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all" />
                    )}
                  </div>
                ))}
                {section.toggles?.map((toggle, ti) => (
                  <div key={ti} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{toggle.label}</p>
                      <p className="text-xs text-slate-500">{toggle.desc}</p>
                    </div>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${toggle.on ? 'bg-teal-600' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggle.on ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
                {section.items?.map((item, ii) => (
                  <div key={ii} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    {item.type === 'toggle' ? (
                      <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${item.on ? 'bg-teal-600' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.on ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    ) : (
                      <select className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600">
                        {item.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Admin Profile</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Admin User</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                <Shield className="w-4 h-4" /> Security Settings
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Integrations</h3>
            <div className="space-y-3">
              {[
                { name: 'Chapa', icon: CreditCard, status: 'Enabled' },
                { name: 'Telebirr', icon: Phone, status: 'Enabled' },
                { name: 'SMS Gateway', icon: Mail, status: 'Disabled' },
              ].map((int, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <int.icon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900">{int.name}</span>
                  </div>
                  <StatusBadge status={int.status} />
                </div>
              ))}
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
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 z-50 transition-all duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center h-16 border-b border-slate-100 ${sidebarOpen ? 'px-6' : 'px-4 justify-center'}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && <span className="text-lg font-extrabold text-slate-900 tracking-tight">PharmaSys</span>}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id || (item.id === 'pharmacies' && activePage === 'pharmacy-detail');
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handlePageChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } ${!sidebarOpen ? 'justify-center' : ''}`}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={`border-t border-slate-100 p-3 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="hidden sm:block relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="pl-9 pr-4 py-2 w-64 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }} className="p-2 hover:bg-slate-100 rounded-xl relative transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {[
                      { msg: 'New pharmacy registration pending', sub: 'Dire Dawa Care' },
                      { msg: 'Payment failed', sub: 'Hawassa Medical Store' },
                      { msg: 'Subscription renewal due', sub: '3 pharmacies' },
                    ].map((n, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-slate-900">{n.msg}</p>
                        <p className="text-xs text-slate-500 mt-1">{n.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-teal-600" />
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-700">Admin</span>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">Admin User</p>
                    <p className="text-xs text-slate-500">admin@pharmasys.et</p>
                  </div>
                  <button onClick={() => handlePageChange('settings')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={() => setIsAuthenticated(false)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
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
        message="Are you sure you want to proceed with this action? This may affect platform operations."
      />
    </div>
  );
}
