import React, { useState,  } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Building2, ShieldCheck, CreditCard, Users, BarChart3, FileText,
  Megaphone, ToggleLeft, Settings, Bell, User, ChevronDown, LogOut,
  Eye, Ban, Check, X, Filter, Calendar, ArrowUpRight, ArrowDownRight,
  DollarSign, Clock, EyeOff, Key, Edit, Download, ChevronRight, Menu,
  Package, FileCheck, RefreshCw, Plus, Search as SearchIcon, ShieldPlus,
  Lock, Mail, AlertTriangle, HelpCircle, Target
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import {
  fetchAdminDashboardStats,
  fetchPharmacies,
  fetchPharmacyDetail,
  updatePharmacyStatus,
  fetchUsers,
  fetchVerificationQueue,
  fetchPayments,
  fetchAuditLogs,
  fetchPlatformSettings,
  savePlatformSettings,
  fetchFeatureFlags,
  toggleFeatureFlag,
  fetchAnnouncements,
  createAnnouncement,
  fetchSubscriptionConfig,
  fetchSubscriptionTiers,
  updateSubscriptionTiers
} from "./services/admin";

const COLORS = ["#0d9488", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];

// ─── Shared UI Components ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Suspended: "bg-red-50 text-red-700 border-red-200",
    Successful: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
    Refunded: "bg-slate-50 text-slate-700 border-slate-200",
    Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    Sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Enabled: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Disabled: "bg-slate-50 text-slate-700 border-slate-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
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
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-24">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
      <AlertTriangle className="w-8 h-8 text-red-500" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to Load Data</h3>
    <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">{error?.message || "An unexpected error occurred"}</p>
    {onRetry && (
      <button onClick={onRetry} className="px-6 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
        Retry
      </button>
    )}
  </div>
);

// ─── Login Page ────────────────────────────────────────────────────────────────

const AdminLoginPage = ({ onLogin }) => {  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError(err.code === "auth/invalid-credential" ? "Invalid email or password" : err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <div className="hidden lg:flex lg:flex-[1.2] bg-gradient-to-br from-teal-600 to-emerald-600 flex-col justify-center p-16 xl:p-24 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-4 mb-12 relative">
          <div className="bg-white/20 p-3 rounded-2xl shadow-lg backdrop-blur-sm"><ShieldPlus size={40} /></div>
          <span className="text-4xl font-extrabold tracking-tight">PharmaCare</span>
        </div>
        <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight mb-8 relative">Platform<br />Management<br />Console.</h1>
        <p className="text-xl opacity-90 max-w-md leading-relaxed relative">Monitor, manage, and scale your pharmacy SaaS platform from a single unified dashboard.</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center"><ShieldPlus className="text-white w-6 h-6" /></div>
            <span className="text-2xl font-extrabold text-slate-900">PharmaCare Admin</span>
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
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) =>
                setEmail(e.target.value)} className="w-full py-3.5 pl-12 pr-4
                rounded-xl border-2 border-slate-100 bg-slate-50 outline-none
                text-sm transition-all focus:border-teal-600 focus:bg-white
                focus:ring-4 focus:ring-teal-600/10"
                placeholder="admin@pharmaare.et"
                required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full py-3.5 pl-12 pr-12 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none text-sm transition-all focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full h-14 text-base font-bold rounded-xl mt-4 flex items-center justify-center gap-2 bg-teal-600 text-white border-none transition-all hover:bg-teal-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20">
              {loading ? <span className="animate-pulse">Authenticating...</span> : <>Sign In <ArrowUpRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── SUBSCRIPTIONS MANAGER COMPONENT ─────────────────────────────────────────
const SubscriptionsManager = ({ isAuthenticated, queryClient }) => {
  const [localTiers, setLocalTiers] = useState({});
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const tiersQuery = useQuery({
    queryKey: ["adminSubscriptionTiers"],
    queryFn: fetchSubscriptionTiers,
    enabled: isAuthenticated,
  });

  React.useEffect(() => {
    if (tiersQuery.data?.tiers) {
      setLocalTiers(tiersQuery.data.tiers);
    }
  }, [tiersQuery.data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSubscriptionTiers(localTiers);
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["adminSubscriptionTiers"] });
    } catch (error) {
      alert("Failed to save tiers: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (tierId, field, value) => {
    setLocalTiers(prev => ({ ...prev, [tierId]: { ...prev[tierId], [field]: value } }));
  };

  const updateTierLimit = (tierId, field, value) => {
    setLocalTiers(prev => ({ ...prev, [tierId]: { ...prev[tierId], limits: { ...prev[tierId].limits, [field]: Number(value) } } }));
  };

  const updateTierPricing = (tierId, field, value) => {
    setLocalTiers(prev => ({ ...prev, [tierId]: { ...prev[tierId], pricing: { ...prev[tierId].pricing, [field]: Number(value) } } }));
  };

  const toggleTierEnabled = (tierId) => {
    setLocalTiers(prev => ({ ...prev, [tierId]: { ...prev[tierId], enabled: !prev[tierId].enabled } }));
  };

  if (tiersQuery.isLoading) return <LoadingState />;
  if (tiersQuery.error) return <ErrorState error={tiersQuery.error} onRetry={() => tiersQuery.refetch()} />;
  const tiers = localTiers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Tiers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage plan pricing, limits, and features</p>
        </div>
        <div className="flex gap-3">
          {editMode ? (
            <>
              <button onClick={() => { setEditMode(false); setLocalTiers(tiersQuery.data?.tiers || {}); }} disabled={saving} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-70">{saving ? "Saving..." : "Save Changes"}</button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]">Edit Tiers</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(tiers).map(([tierId, tier]) => (
          <div key={tierId} className={`bg-white rounded-2xl border-2 ${tier.enabled ? "border-slate-100" : "border-slate-200 opacity-60"} p-6 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              {editMode ? (
                <input type="text" value={tier.name} onChange={(e) => updateTier(tierId, "name", e.target.value)} className="text-lg font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 w-full" />
              ) : (
                <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
              )}
              {editMode && (
                <button onClick={() => toggleTierEnabled(tierId)} className={`ml-2 px-3 py-1 text-xs font-semibold rounded-lg ${tier.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {tier.enabled ? "Enabled" : "Disabled"}
                </button>
              )}
            </div>

            {editMode ? (
              <textarea value={tier.description || ""} onChange={(e) => updateTier(tierId, "description", e.target.value)} className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full mb-4 resize-none" rows={2} />
            ) : (
              <p className="text-sm text-slate-500 mb-4">{tier.description}</p>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex items-baseline gap-2">
                {editMode ? (
                  <>
                    <input type="number" value={tier.pricing.monthly} onChange={(e) => updateTierPricing(tierId, "monthly", Number(e.target.value))} className="text-2xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-24" />
                    <span className="text-sm text-slate-500">/mo</span>
                    <input type="number" value={tier.pricing.yearly} onChange={(e) => updateTierPricing(tierId, "yearly", Number(e.target.value))} className="text-lg font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-24 ml-2" />                    <span className="text-sm text-slate-500">/yr</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-black text-slate-900">ETB {tier.pricing.monthly.toLocaleString()}</span>
                    <span className="text-sm text-slate-500">/mo</span>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Limits</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { key: "maxSkus", label: "SKUs" },
                  { key: "maxUsers", label: "Users" },
                  { key: "maxBranches", label: "Branches" },
                  { key: "dailyTransactions", label: "Daily Tx" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <span className="text-slate-500">{label}:</span>{" "}
                    {editMode ? (
                      <input type="number" value={tier.limits[key]} onChange={(e) => updateTierLimit(tierId, key, Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs" />
                    ) : (
                      <span className="font-semibold">{tier.limits[key] === -1 ? "∞" : tier.limits[key]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Features</p>
              {editMode ? (
                <textarea value={(tier.features || []).join("\n")} onChange={(e) => updateTier(tierId, "features", e.target.value.split("\n").filter(f => f.trim()))} className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full resize-none" rows={5} placeholder="One feature per line" />
              ) : (
                <ul className="space-y-1">
                  {(tier.features || []).map((feat, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>    </div>
  );
};

// ─── PLATFORM SETTINGS MANAGER COMPONENT ─────────────────────────────────────
const PlatformSettingsManager = ({ settingsQuery, saveSettingsMutation }) => {
  const settings = settingsQuery.data || {};
  const [localSettings, setLocalSettings] = useState(settings);

  React.useEffect(() => { setLocalSettings(settings); }, [settings]);

  if (settingsQuery.isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Global platform configuration</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Platform Name</label>
            <input type="text" value={localSettings.platformName || ""} onChange={(e) => setLocalSettings({ ...localSettings, platformName: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Email</label>
            <input type="email" value={localSettings.supportEmail || ""} onChange={(e) => setLocalSettings({ ...localSettings, supportEmail: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Maintenance Mode</label>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.maintenanceMode ? "bg-teal-600" : "bg-slate-300"}`}
              onClick={() => setLocalSettings({ ...localSettings, maintenanceMode: !localSettings.maintenanceMode })}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => saveSettingsMutation.mutate(localSettings)}
            disabled={saveSettingsMutation.isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-slate-900/10"
          >
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
        {saveSettingsMutation.isSuccess && <p className="text-sm text-emerald-600 font-semibold mt-3">✓ Settings saved successfully</p>}
      </div>    </div>
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [pharmacyFilter, setPharmacyFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const queryClient = useQueryClient();

  // ✅ ALL HOOKS BEFORE ANY EARLY RETURN
  const dashboardQuery = useQuery({ queryKey: ["adminDashboard"], queryFn: fetchAdminDashboardStats, enabled: isAuthenticated });
  const pharmaciesQuery = useQuery({ queryKey: ["adminPharmacies", pharmacyFilter], queryFn: () => fetchPharmacies({ status: pharmacyFilter }), enabled: isAuthenticated });
  const pharmacyDetailQuery = useQuery({ queryKey: ["adminPharmacyDetail", selectedPharmacyId], queryFn: () => fetchPharmacyDetail(selectedPharmacyId), enabled: isAuthenticated && !!selectedPharmacyId });
  const usersQuery = useQuery({ queryKey: ["adminUsers", searchQuery], queryFn: () => fetchUsers({ search: searchQuery }), enabled: isAuthenticated });
  const verificationQuery = useQuery({ queryKey: ["adminVerification"], queryFn: fetchVerificationQueue, enabled: isAuthenticated });
  const paymentsQuery = useQuery({ queryKey: ["adminPayments", paymentFilter], queryFn: () => fetchPayments({ status: paymentFilter }), enabled: isAuthenticated });
  const auditQuery = useQuery({ queryKey: ["adminAuditLogs"], queryFn: () => fetchAuditLogs(50), enabled: isAuthenticated });
  const announcementsQuery = useQuery({ queryKey: ["adminAnnouncements"], queryFn: fetchAnnouncements, enabled: isAuthenticated });  const featureFlagsQuery = useQuery({ queryKey: ["adminFeatureFlags"], queryFn: fetchFeatureFlags, enabled: isAuthenticated });
  const settingsQuery = useQuery({ queryKey: ["adminSettings"], queryFn: fetchPlatformSettings, enabled: isAuthenticated });
  const subscriptionConfigQuery = useQuery({ queryKey: ["adminSubscriptionConfig"], queryFn: fetchSubscriptionConfig, enabled: isAuthenticated });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ pharmacyId, status, reason }) => updatePharmacyStatus(pharmacyId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPharmacies"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["adminVerification"] });
    },
  });

  const toggleFlagMutation = useMutation({
    mutationFn: ({ flagId, enabled }) => toggleFeatureFlag(flagId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminFeatureFlags"] }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (settings) => savePlatformSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminSettings"] }),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (data) => createAnnouncement(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] }),
  });

  // Auth listener
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsub();
  }, []);

  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={() => {}} />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pharmacies", label: "Pharmacies", icon: Building2 },
    { id: "verification", label: "Verification", icon: ShieldCheck },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "audit", label: "Audit Logs", icon: FileText },    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "features", label: "Feature Flags", icon: ToggleLeft },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handlePageChange = (page) => {
    setActivePage(page);
    setSelectedPharmacyId(null);
    setShowNotifications(false);
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
  };

  // ─── PAGE RENDERERS ─────────────────────────────────────────────────────────

  const renderDashboard = () => {
    if (dashboardQuery.isLoading) return <LoadingState />;
    if (dashboardQuery.error) return <ErrorState error={dashboardQuery.error} onRetry={() => dashboardQuery.refetch()} />;
    const stats = dashboardQuery.data || {};

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Platform overview and key metrics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Pharmacies", value: stats.totalPharmacies || 0, icon: Building2, color: "bg-teal-50 text-teal-600" },
            { label: "Active Pharmacies", value: stats.activePharmacies || 0, icon: Check, color: "bg-blue-50 text-blue-600" },
            { label: "MRR", value: `ETB ${(stats.mrr || 0).toLocaleString()}`, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
            { label: "Pending Approvals", value: stats.pendingApprovals || 0, icon: Clock, color: "bg-red-50 text-red-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}><stat.icon className="w-5 h-5" /></div>
              </div>
            </div>
          ))}
        </div>
        {/* Plan Distribution Chart */}        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Subscription Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.planDistribution || {}).map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4} dataKey="value"
                >
                  {Object.keys(stats.planDistribution || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Platform Health</h3>
            <div className="space-y-4 pt-4">
              {[
                { label: "Active Rate", pct: stats.totalPharmacies ? Math.round(((stats.activePharmacies || 0) / stats.totalPharmacies) * 100) : 0, color: "bg-emerald-500" },
                { label: "Pending Rate", pct: stats.totalPharmacies ? Math.round(((stats.pendingApprovals || 0) / stats.totalPharmacies) * 100) : 0, color: "bg-amber-500" },
                { label: "Suspended Rate", pct: stats.totalPharmacies ? Math.round(((stats.suspendedPharmacies || 0) / stats.totalPharmacies) * 100) : 0, color: "bg-red-500" },
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
    );
  };

  const renderPharmacies = () => {
    if (pharmaciesQuery.isLoading) return <LoadingState />;
    if (pharmaciesQuery.error) return <ErrorState error={pharmaciesQuery.error} onRetry={() => pharmaciesQuery.refetch()} />;
    const pharmacies = pharmaciesQuery.data?.pharmacies || [];

    return (
      <div className="space-y-6">        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage all registered pharmacies on the platform</p>
          </div>
          <select value={pharmacyFilter} onChange={(e) => setPharmacyFilter(e.target.value)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white transition-all">
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Pharmacy", "Owner", "Location", "Plan", "Status", "Branches", "Users", "Actions"].map(h => (<th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pharmacies.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No pharmacies found</td></tr>
                ) : pharmacies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.adminUid || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{p.address?.city || p.location || "—"}</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">{p.subscription?.tier || "starter"}</span></td>
                    <td className="px-6 py-4"><StatusBadge status={p.status === "active" ? "Active" : p.status === "pending" ? "Pending" : "Suspended"} /></td>
                    <td className="px-6 py-4 text-slate-600">{p.usageMetrics?.currentBranchCount || 1}</td>
                    <td className="px-6 py-4 text-slate-600">{p.usageMetrics?.currentUserCount || 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedPharmacyId(p.id); handlePageChange("pharmacy-detail"); }} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
                        {p.status === "active" && <button onClick={() => { setConfirmAction(() => () => statusMutation.mutate({ pharmacyId: p.id, status: "suspended", reason: "Suspended by admin" })); setShowConfirmDialog(true); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Suspend"><Ban className="w-4 h-4" /></button>}
                        {(p.status === "suspended" || p.status === "pending") && <button onClick={() => { setConfirmAction(() => () => statusMutation.mutate({ pharmacyId: p.id, status: "active", reason: "Approved by admin" })); setShowConfirmDialog(true); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Activate"><Check className="w-4 h-4" /></button>}
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
  };

  const renderPharmacyDetail = () => {
    if (!selectedPharmacyId) return null;
    if (pharmacyDetailQuery.isLoading) return <LoadingState />;    if (pharmacyDetailQuery.error) return <ErrorState error={pharmacyDetailQuery.error} onRetry={() => pharmacyDetailQuery.refetch()} />;
    const pharmacy = pharmacyDetailQuery.data;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => handlePageChange("pharmacies")} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 rotate-180 text-slate-600" /></button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{pharmacy.name}</h1>
            <p className="text-sm text-slate-500 mt-1">ID: {pharmacy.id}</p>
          </div>
          <div className="ml-auto"><StatusBadge status={pharmacy.status === "active" ? "Active" : pharmacy.status === "pending" ? "Pending" : "Suspended"} /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Pharmacy Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "License Number", value: pharmacy.licenseNumber || "—" },
                  { label: "Tax ID", value: pharmacy.taxId || "—" },
                  { label: "Phone", value: pharmacy.phone || "—" },
                  { label: "Email", value: pharmacy.email || "—" },
                  { label: "Type", value: pharmacy.pharmacyType || "—" },
                  { label: "Website", value: pharmacy.website || "—" },
                ].map((item, i) => (
                  <div key={i}><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p><div className="text-sm font-semibold text-slate-900 mt-1">{item.value}</div></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Subscription</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tier</p><div className="text-sm font-semibold text-slate-900 mt-1 capitalize">{pharmacy.subscription?.tier || "starter"}</div></div>
                <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Cycle</p><div className="text-sm font-semibold text-slate-900 mt-1 capitalize">{pharmacy.subscription?.billingCycle || "monthly"}</div></div>
                <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Status</p><div className="mt-1"><StatusBadge status={pharmacy.subscription?.status === "active" ? "Active" : "Pending"} /></div></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Members ({pharmacy.members?.length || 0})</h3>
              <div className="space-y-2">
                {(pharmacy.members || []).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div><p className="text-sm font-semibold text-slate-900">{m.name || m.uid}</p><p className="text-xs text-slate-500">{m.email}</p></div>
                    <span className="text-xs font-semibold text-slate-500 capitalize">{m.role}</span>
                  </div>
                ))}
                {(!pharmacy.members || pharmacy.members.length === 0) && <p className="text-sm text-slate-400">No members found</p>}
              </div>
            </div>          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Actions</h3>
              <div className="space-y-2">
                {pharmacy.status !== "active" && <button onClick={() => statusMutation.mutate({ pharmacyId: pharmacy.id, status: "active", reason: "Approved by admin" })} disabled={statusMutation.isPending} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-70"><Check className="w-4 h-4" /> Approve Pharmacy</button>}
                {pharmacy.status === "active" && <button onClick={() => { setConfirmAction(() => () => statusMutation.mutate({ pharmacyId: pharmacy.id, status: "suspended", reason: "Suspended by admin" })); setShowConfirmDialog(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all active:scale-[0.98]"><Ban className="w-4 h-4" /> Suspend Pharmacy</button>}
              </div>
              {statusMutation.isPending && <p className="text-xs text-slate-400 mt-2 text-center animate-pulse">Updating...</p>}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Usage Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: "SKUs", current: pharmacy.usageMetrics?.currentSkuCount || 0, max: 500, color: "bg-teal-600" },
                  { label: "Users", current: pharmacy.usageMetrics?.currentUserCount || 0, max: 5, color: "bg-blue-600" },
                  { label: "Branches", current: pharmacy.usageMetrics?.currentBranchCount || 0, max: 2, color: "bg-amber-600" },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500 font-medium">{m.label}</span>
                      <span className="text-slate-900 font-bold">{m.current} / {m.max}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${m.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, (m.current / m.max) * 100)}%` }}></div>
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

  const renderVerification = () => {
    if (verificationQuery.isLoading) return <LoadingState />;
    if (verificationQuery.error) return <ErrorState error={verificationQuery.error} onRetry={() => verificationQuery.refetch()} />;
    const queue = verificationQuery.data?.queue || [];

    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Verification Queue</h1><p className="text-sm text-slate-500 mt-1">Review and approve pending pharmacy registrations</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">Pending Reviews ({queue.length})</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Pharmacy", "Type", "Location", "Submitted", "Actions"].map(h => (<th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>))}</tr>              </thead>
              <tbody className="divide-y divide-slate-50">
                {queue.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No pending verifications 🎉</td></tr>
                ) : queue.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{p.pharmacyType || "retail"}</td>
                    <td className="px-6 py-4 text-slate-600">{p.address?.city || "—"}</td>
                    <td className="px-6 py-4 text-slate-500">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => statusMutation.mutate({ pharmacyId: p.id, status: "active", reason: "Documents verified" })} disabled={statusMutation.isPending} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve"><Check className="w-4 h-4" /></button>
                        <button onClick={() => { setConfirmAction(() => () => statusMutation.mutate({ pharmacyId: p.id, status: "suspended", reason: "Documents rejected" })); setShowConfirmDialog(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Reject"><X className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedPharmacyId(p.id); handlePageChange("pharmacy-detail"); }} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
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
  };


  const renderPayments = () => {
    if (paymentsQuery.isLoading) return <LoadingState />;
    if (paymentsQuery.error) return <ErrorState error={paymentsQuery.error} onRetry={() => paymentsQuery.refetch()} />;
    const payments = paymentsQuery.data?.payments || [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments</h1><p className="text-sm text-slate-500 mt-1">Transaction history across all pharmacies</p></div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white transition-all">
            <option value="All">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Transaction ID", "Pharmacy", "Amount", "Provider", "Status", "Date"].map(h => (<th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No payments found</td></tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.txRef || p.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.pharmacyName || p.pharmacyId || "—"}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">ETB {(p.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{p.provider || "—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status === "successful" ? "Successful" : p.status === "pending" ? "Pending" : "Failed"} /></td>
                    <td className="px-6 py-4 text-slate-500">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (usersQuery.isLoading) return <LoadingState />;
    if (usersQuery.error) return <ErrorState error={usersQuery.error} onRetry={() => usersQuery.refetch()} />;    const users = usersQuery.data?.users || [];

    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1><p className="text-sm text-slate-500 mt-1">Platform users and account management</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">All Users ({users.length})</h3>
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 w-64 transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Name", "Email", "Role", "Status", "Pharmacy"].map(h => (<th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{u.name || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{u.role}</td>
                    <td className="px-6 py-4"><StatusBadge status={u.status === "Active" ? "Active" : u.status === "Pending" ? "Pending" : "Suspended"} /></td>
                    <td className="px-6 py-4 text-slate-500">{u.pharmacyId ? u.pharmacyId.slice(0, 8) + "..." : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (dashboardQuery.isLoading) return <LoadingState />;
    const stats = dashboardQuery.data || {};
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics</h1><p className="text-sm text-slate-500 mt-1">SaaS business metrics and insights</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "MRR", value: `ETB ${(stats.mrr || 0).toLocaleString()}` },
            { label: "Total Pharmacies", value: stats.totalPharmacies || 0 },
            { label: "Active Users", value: stats.totalUsers || 0 },
            { label: "Active Rate", value: `${stats.totalPharmacies ? Math.round(((stats.activePharmacies || 0) / stats.totalPharmacies) * 100) : 0}%` },          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(stats.planDistribution || {}).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderAudit = () => {
    if (auditQuery.isLoading) return <LoadingState />;
    if (auditQuery.error) return <ErrorState error={auditQuery.error} onRetry={() => auditQuery.refetch()} />;
    const logs = auditQuery.data?.logs || [];

    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs</h1><p className="text-sm text-slate-500 mt-1">Security and activity tracking</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Actor", "Action", "Target", "Details", "Timestamp"].map(h => (<th key={h} className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No audit logs found</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{log.actor || "System"}</td>
                    <td className="px-6 py-4 text-slate-600">{log.action}</td>
                    <td className="px-6 py-4 text-slate-600">{log.target || "—"}</td>
                    <td className="px-6 py-4 text-slate-500">{log.details || "—"}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAnnouncements = () => {
    if (announcementsQuery.isLoading) return <LoadingState />;
    const announcements = announcementsQuery.data?.announcements || [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Announcements</h1><p className="text-sm text-slate-500 mt-1">Send platform-wide messages to pharmacies</p></div>
          <button onClick={() => createAnnouncementMutation.mutate({ title: "New Announcement", message: "Draft announcement", target: "All Pharmacies", status: "Scheduled" })} disabled={createAnnouncementMutation.isPending} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98] disabled:opacity-70">
            <Plus className="w-4 h-4" /> Create Announcement
          </button>
        </div>
        <div className="space-y-4">
          {announcements.length === 0 && <p className="text-slate-400 text-center py-12">No announcements yet</p>}
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="text-base font-bold text-slate-900">{a.title}</h3><p className="text-sm text-slate-500 mt-1 leading-relaxed">{a.message}</p></div>
                <StatusBadge status={a.status === "Sent" ? "Sent" : "Scheduled"} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mt-4 pt-4 border-t border-slate-100">
                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> {a.target || "All"}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFeatures = () => {
    if (featureFlagsQuery.isLoading) return <LoadingState />;
    if (featureFlagsQuery.error) return <ErrorState error={featureFlagsQuery.error} onRetry={() => featureFlagsQuery.refetch()} />;
    const flags = featureFlagsQuery.data?.flags || [];

    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Feature Flags</h1><p className="text-sm text-slate-500 mt-1">Manage feature availability across plans</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {flags.length === 0 && <p className="text-slate-400 text-center py-12">No feature flags configured</p>}
            {flags.map((f) => (              <div key={f.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
                    <StatusBadge status={f.enabled ? "Enabled" : "Disabled"} />
                  </div>
                  <p className="text-sm text-slate-500">{f.description || ""}</p>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${f.enabled ? "bg-teal-600" : "bg-slate-300"}`}
                    onClick={() => toggleFlagMutation.mutate({ flagId: f.id, enabled: !f.enabled })}
                    disabled={toggleFlagMutation.isPending}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.enabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


const renderContent = () => {
    switch (activePage) {
      case "dashboard": return renderDashboard();
      case "pharmacies": return renderPharmacies();
      case "pharmacy-detail": return renderPharmacyDetail();
      case "verification": return renderVerification();
      
      // ✅ UPDATED: Render standalone components
      case "subscriptions": return <SubscriptionsManager isAuthenticated={isAuthenticated} queryClient={queryClient} />;
      case "settings": return <PlatformSettingsManager settingsQuery={settingsQuery} saveSettingsMutation={saveSettingsMutation} />;
      
      case "payments": return renderPayments();
      case "users": return renderUsers();
      case "analytics": return renderAnalytics();
      case "audit": return renderAudit();
      case "announcements": return renderAnnouncements();
      case "features": return renderFeatures();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {mobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}></div>}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 z-50 transition-all duration-200 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center h-16 border-b border-slate-100 ${sidebarOpen ? "px-6" : "px-4 justify-center"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"><Package className="w-5 h-5 text-white" /></div>
              {sidebarOpen && <span className="text-lg font-extrabold
              text-slate-900 tracking-tight">PharnaCare</span>}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3">            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id || (item.id === "pharmacies" && activePage === "pharmacy-detail");
                return (
                  <li key={item.id}>
                    <button onClick={() => handlePageChange(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"} ${!sidebarOpen ? "justify-center" : ""}`} title={!sidebarOpen ? item.label : ""}>
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className={`border-t border-slate-100 p-3 ${!sidebarOpen ? "flex justify-center" : ""}`}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"><Menu className="w-5 h-5 text-slate-600" /></button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-teal-600" /></div>
                <span className="hidden md:block text-sm font-semibold text-slate-700">Admin</span>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100"><p className="text-sm font-bold text-slate-900">Super Admin</p></div>
                  <button onClick={() => handlePageChange("settings")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"><Settings className="w-4 h-4" /> Settings</button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{renderContent()}</main>
      </div>
      <ConfirmDialog isOpen={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} onConfirm={() => { confirmAction?.(); setShowConfirmDialog(false); }} title="Confirm Action" message="Are you sure you want to proceed? This action may affect platform operations." />
    </div>
  );
}
