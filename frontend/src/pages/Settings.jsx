import React, { useState, useEffect } from "react";
import {
  User,
  Building2,
  Shield,
  Lock,
  Save,
  X,
  Bell,
  BellOff,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  MapPin,
  Globe,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import CustomSelect from "../components/CustomSelect";
import { updateSystemSettings } from "../services/settings.js";
import { updateUserProfile } from "../services/users.js";
import Avatar from "../components/Avatar.jsx";
import {
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
} from "../services/notification/notifications.js";

// ─── Navigation Config ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "pharmacy", label: "Pharmacy Info", icon: Building2, desc: "Business details & address" },
  { id: "profile", label: "My Profile", icon: User, desc: "Your personal account" },
  { id: "system", label: "Preferences", icon: SettingsIcon, desc: "Currency, language & alerts" },
  { id: "security", label: "Security", icon: Shield, desc: "Password & notifications" },
];

// ─── Reusable UI Primitives ───────────────────────────────────────────────────
const SectionHeader = ({ title, description }) => (  <div className="mb-6 border-b border-slate-100 pb-4">
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
  </div>
);

const FormField = ({ label, children, hint, required }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

const Toast = ({ message, type = "success", onClose }) => {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border animate-in slide-in-from-bottom-4 fade-in duration-300 ${
      type === "success" 
        ? "bg-white border-emerald-100 text-emerald-800" 
        : "bg-white border-red-100 text-red-800"
    }`}>
      {type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Settings = () => {
  const { user } = useAuth();
  const { settings: contextSettings, updateLanguage, t, setGlobalSettings } = useSettings();

  const [activeTab, setActiveTab] = useState("pharmacy");
  const [toast, setToast] = useState({ msg: "", type: "success" });

  // Pharmacy State
  const [pharmacyForm, setPharmacyForm] = useState({
    pharmacyName: "",
    licenseNumber: "",
    taxId: "",
    phone: "",
    email: "",
    website: "",
    address: { street: "", city: "", state: "", zip: "", country: "Ethiopia" },
  });
  const [savingPharmacy, setSavingPharmacy] = useState(false);
  // Personal Profile State
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", avatar: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // System State
  const [localState, setLocalState] = useState({
    currency: contextSettings.currency || "ETB",
    language: contextSettings.language || "en",
    lowStockThreshold: contextSettings.lowStockThreshold || 10,
    expiryWarningDays: contextSettings.expiryWarningDays || 60,
  });
  const [savingSystem, setSavingSystem] = useState(false);

  // Notification State
  const [isSubscribedState, setIsSubscribedState] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Password Modal State
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "" });
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // ─── Sync Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || "", phone: user.phone || "", avatar: user.avatar || "" });
      
      // Populate pharmacy form from user object (assuming nested pharmacy data or flattened)
      setPharmacyForm({
        pharmacyName: user.pharmacyName || "",
        licenseNumber: user.licenseNumber || "",
        taxId: user.taxId || "",
        phone: user.businessPhone || user.phone || "",
        email: user.businessEmail || user.email || "",
        website: user.website || "",
        address: user.address || { street: "", city: "", state: "", zip: "", country: "Ethiopia" },
      });
    }
  }, [user]);

  useEffect(() => {
    setLocalState({
      currency: contextSettings.currency || "ETB",
      language: contextSettings.language || "en",
      lowStockThreshold: contextSettings.lowStockThreshold || 10,
      expiryWarningDays: contextSettings.expiryWarningDays || 60,    });
  }, [contextSettings]);

  useEffect(() => { isSubscribed().then(setIsSubscribedState); }, []);

  useEffect(() => {
    if (toast.msg) {
      const timer = setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.msg]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const handlePharmacySave = async () => {
    setSavingPharmacy(true);
    try {
      // TODO: Replace with your actual updatePharmacy service call
      // await updatePharmacy(user.pharmacyId, pharmacyForm);
      
      // Simulating API delay for UX demonstration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showToast("Pharmacy information updated successfully");
    } catch (err) {
      showToast("Failed to update pharmacy info", "error");
    } finally {
      setSavingPharmacy(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.uid) return;
    setSavingProfile(true);
    try {
      await updateUserProfile(user.uid, profileForm);
      showToast("Profile updated successfully");
    } catch (err) {
      showToast("Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSystemSave = async () => {
    setSavingSystem(true);
    try {
      const { language, ...rest } = localState;
      await updateSystemSettings({ ...rest, language }, user?.pharmacyId);      updateLanguage(language);
      setGlobalSettings({ ...rest, language });
      showToast("Preferences saved successfully");
    } catch (err) {
      showToast("Failed to save preferences", "error");
    } finally {
      setSavingSystem(false);
    }
  };

  const handleToggleNotifications = async () => {
    setNotifLoading(true);
    try {
      if (isSubscribedState) {
        await unsubscribeFromPush();
        setIsSubscribedState(false);
        showToast("Notifications disabled");
      } else {
        await subscribeToPush(user?.uid, user?.pharmacyId);
        setIsSubscribedState(true);
        showToast("Notifications enabled");
      }
    } catch (err) {
      showToast("Please allow browser permissions first", "error");
    } finally {
      setNotifLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (!pwForm.current || !pwForm.newPw) return setPwError("Both fields are required");
    if (pwForm.newPw.length < 6) return setPwError("Password must be at least 6 characters");

    setPwLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user logged in");

      const credential = EmailAuthProvider.credential(currentUser.email, pwForm.current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, pwForm.newPw);

      setShowPwModal(false);
      setPwForm({ current: "", newPw: "" });
      showToast("Password updated successfully");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwError("Current password is incorrect");      } else if (err.code === "auth/weak-password") {
        setPwError("New password is too weak");
      } else {
        setPwError("Failed to update password");
      }
    } finally {
      setPwLoading(false);
    }
  };

  // ─── Tab Content Renderers ──────────────────────────────────────────────────
  
  const renderPharmacyTab = () => (
    <div className="space-y-10 max-w-3xl">
      <SectionHeader 
        title="Business Information" 
        description="This information appears on invoices, receipts, and regulatory reports." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <FormField label="Pharmacy Name" required>
          <input 
            type="text" 
            value={pharmacyForm.pharmacyName} 
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, pharmacyName: e.target.value })} 
            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
            placeholder="e.g. Bole Community Pharmacy"
          />
        </FormField>

        <FormField label="License Number" required>
          <input 
            type="text" 
            value={pharmacyForm.licenseNumber} 
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, licenseNumber: e.target.value })} 
            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
            placeholder="e.g. PH/12345/2023"
          />
        </FormField>

        <FormField label="Tax ID / TIN">
          <input 
            type="text" 
            value={pharmacyForm.taxId} 
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, taxId: e.target.value })} 
            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
          />
        </FormField>

        <FormField label="Website">          <input 
            type="url" 
            value={pharmacyForm.website} 
            onChange={(e) => setPharmacyForm({ ...pharmacyForm, website: e.target.value })} 
            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
            placeholder="www.example.com"
          />
        </FormField>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-600" /> Physical Address
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2">
            <FormField label="Street Address">
              <input 
                type="text" 
                value={pharmacyForm.address.street} 
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: { ...pharmacyForm.address, street: e.target.value } })} 
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </FormField>
          </div>
          <FormField label="City">
            <input 
              type="text" 
              value={pharmacyForm.address.city} 
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: { ...pharmacyForm.address, city: e.target.value } })} 
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </FormField>
          <FormField label="Region / State">
            <input 
              type="text" 
              value={pharmacyForm.address.state} 
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: { ...pharmacyForm.address, state: e.target.value } })} 
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </FormField>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end sticky bottom-0 bg-white/95 backdrop-blur py-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
        <button 
          onClick={handlePharmacySave} 
          disabled={savingPharmacy} 
          className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-slate-900/10"
        >          <Save className="w-4 h-4" />
          {savingPharmacy ? "Saving..." : "Update Pharmacy Info"}
        </button>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-8 max-w-2xl">
      <SectionHeader title="Personal Information" description="Your identity within the PharmaCare platform." />
      
      <div className="flex items-start gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <Avatar src={profileForm.avatar} name={user?.name} pharmacyName={user?.pharmacyName} size={80} className="border-4 border-white shadow-sm" />
        <div className="flex-1 space-y-4">
          <FormField label="Full Name">
            <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all" />
          </FormField>
          <FormField label="Mobile Number">
            <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all" />
          </FormField>
          <div className="pt-2">
             <p className="text-xs text-slate-400">Email address cannot be changed. Contact support if you need to update it.</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button onClick={handleProfileSave} disabled={savingProfile} className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-70">
          {savingProfile ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-10 max-w-2xl">
      <section>
        <SectionHeader title="Inventory Alerts" description="Configure automated warnings for stock levels and expirations." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField label="Low Stock Threshold" hint="Items below this quantity will be flagged">
            <div className="relative">
              <input type="number" min="0" value={localState.lowStockThreshold} onChange={(e) => setLocalState({ ...localState, lowStockThreshold: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-12 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Units</span>
            </div>
          </FormField>
          <FormField label="Expiry Warning" hint="Days before expiration to trigger alert">
            <div className="relative">
              <input type="number" min="0" value={localState.expiryWarningDays} onChange={(e) => setLocalState({ ...localState, expiryWarningDays: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-12 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Days</span>
            </div>          </FormField>
        </div>
      </section>

      <hr className="border-slate-100" />

      <section>
        <SectionHeader title="Localization" description="Regional formatting and display preferences." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField label="Default Currency">
            <CustomSelect value={localState.currency} onChange={(val) => setLocalState({ ...localState, currency: val })} options={[{ value: "ETB", label: "Ethiopian Birr (ETB)" }, { value: "USD", label: "US Dollar (USD)" }]} />
          </FormField>
          <FormField label="Interface Language">
            <CustomSelect value={localState.language} onChange={(val) => setLocalState({ ...localState, language: val })} options={[{ value: "en", label: "English" }, { value: "am", label: "Amharic (አማርኛ)" }]} />
          </FormField>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-100 flex justify-end sticky bottom-0 bg-white/95 backdrop-blur py-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
        <button onClick={handleSystemSave} disabled={savingSystem} className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-slate-900/10">
          <Save className="w-4 h-4" />
          {savingSystem ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6 max-w-2xl">
      <section className="p-6 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Password</h3>
            <p className="text-sm text-slate-500 mt-1">Ensure your account stays secure by updating your password regularly.</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg"><Lock className="w-5 h-5 text-slate-400" /></div>
        </div>
        <button onClick={() => setShowPwModal(true)} className="text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline underline-offset-4 transition-all">
          Change Password
        </button>
      </section>

      <section className="p-6 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900">Push Notifications</h3>
            <p className="text-sm text-slate-500 mt-1">Receive real-time browser alerts for critical inventory events.</p>
          </div>
          <div className={`p-2 rounded-lg transition-colors ${isSubscribedState ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
            {isSubscribedState ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}          </div>
        </div>
        
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-sm">
            <div className="font-semibold text-slate-900">{isSubscribedState ? "Active" : "Disabled"}</div>
            <div className="text-slate-500 text-xs mt-0.5">{isSubscribedState ? "You're receiving alerts" : "Turn on to stay updated"}</div>
          </div>
          <button 
            onClick={handleToggleNotifications} 
            disabled={notifLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${isSubscribedState ? "bg-teal-600" : "bg-slate-300"}`}
          >
            <span className={`${isSubscribedState ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
          </button>
        </div>
      </section>
    </div>
  );

  // ─── Main Layout ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="mb-10">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workspace Settings</h1>
          <p className="text-slate-500 mt-1">Manage your pharmacy configuration, team access, and system preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal ${
                    activeTab === item.id
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? "text-teal-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {activeTab === item.id && <ChevronRight className="w-3 h-3 ml-auto hidden lg:block text-teal-400" />}
                </button>
              ))}            </div>

            {/* Contextual Help / Mini Profile */}
            <div className="hidden lg:block mt-10 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 px-4 mb-6">
                <Avatar src={user?.avatar} name={user?.name} size={36} />
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-slate-900 truncate">{user?.name}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.role?.toUpperCase()}</div>
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Need help configuring your pharmacy? 
                  <a href="#" className="text-teal-600 font-semibold hover:underline ml-1">View Documentation</a>
                </p>
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "pharmacy" && renderPharmacyTab()}
              {activeTab === "profile" && renderProfileTab()}
              {activeTab === "system" && renderSystemTab()}
              {activeTab === "security" && renderSecurityTab()}
            </div>
          </main>
        </div>
      </div>

      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: "" })} />

      {/* Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPwModal(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Update Password</h2>
              <button onClick={() => setShowPwModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <FormField label="Current Password">
                <div className="relative">
                  <input type={showCurrentPw ? "text" : "password"} value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-3 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all" autoFocus />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>                </div>
              </FormField>

              <FormField label="New Password">
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-3 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              {pwError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {pwError}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowPwModal(false)} className="flex-1 h-10 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleChangePassword} disabled={pwLoading} className="flex-1 h-10 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all disabled:opacity-70">
                  {pwLoading ? "Updating..." : "Confirm Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;