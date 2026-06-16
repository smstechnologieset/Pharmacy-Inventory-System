import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Lock,
  Smartphone,
  Save,
  HelpCircle,
  X,
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

const Settings = () => {
  const { user } = useAuth();
  const { settings: contextSettings, updateLanguage, t } = useSettings();

  const [localState, setLocalState] = useState({
    currency: contextSettings.currency || "ETB",
    language: contextSettings.language || "en",
    lowStockThreshold: contextSettings.lowStockThreshold || 10,
    expiryWarningDays: contextSettings.expiryWarningDays || 60,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ── Profile Edit State ─────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // ── Password Modal State ─────────────────────────────────────────────────────
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "" });
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    setLocalState({
      currency: contextSettings.currency || "ETB",
      language: contextSettings.language || "en",
      lowStockThreshold: contextSettings.lowStockThreshold || 10,
      expiryWarningDays: contextSettings.expiryWarningDays || 60,
    });
  }, [contextSettings]);

  // Sync profile form when user data loads/updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const { language, ...globalPayload } = localState;
      await updateSystemSettings(globalPayload, user?.pharmacyId);
      updateLanguage(language);
      setSuccessMsg(t("settings.successMsg") || "Settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert(t("settings.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  // ✅ Profile Save Handler
  const handleProfileSave = async () => {
    if (!user?.uid) return;
    setSavingProfile(true);
    setProfileSuccessMsg("");
    try {
      await updateUserProfile(user.uid, {
        name: profileForm.name,
        phone: profileForm.phone,
        avatar: profileForm.avatar,
      });
      setProfileSuccessMsg(
        t("settings.profileUpdated") || "Profile updated successfully!",
      );
      setTimeout(() => setProfileSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      alert(t("settings.failedToUpdateProfile") || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (!pwForm.current || !pwForm.newPw) {
      setPwError(t("settings.passwordFieldsRequired"));
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError(t("settings.passwordTooShort"));
      return;
    }

    setPwLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error(t("settings.noUser"));

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        pwForm.current,
      );
      await reauthenticateWithCredential(currentUser, credential);

      await updatePassword(currentUser, pwForm.newPw);

      setShowPwModal(false);
      setPwForm({ current: "", newPw: "" });
      setSuccessMsg(
        t("settings.passwordUpdated") || "Password updated successfully!",
      );
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Password update error:", err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setPwError(t("settings.currentPasswordIncorrect"));
      } else if (err.code === "auth/weak-password") {
        setPwError(t("settings.weakPassword"));
      } else {
        setPwError(t("settings.passwordUpdateFailed"));
      }
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: "800",
            letterSpacing: "-0.025em",
          }}>
          {t("settings.title")}
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginTop: "4px",
          }}>
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div className="card">
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
              <User size={20} color="var(--primary)" />{" "}
              {t("settings.profileInfo")}
            </h2>

            {/* Profile Header Display */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                padding: "24px",
                background: "var(--primary-light)",
                borderRadius: "24px",
                border: "1px solid rgba(13, 148, 136, 0.1)",
                marginBottom: "24px",
              }}>
              <img
                src={profileForm.avatar || user?.avatar}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "4px solid white",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
                  objectFit: "cover",
                }}
                alt="Avatar"
              />
              <div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "1.2rem",
                    color: "#0F172A",
                  }}>
                  {user?.name}
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    color: "#64748B",
                    marginBottom: "8px",
                  }}>
                  {user?.email}
                </div>
                <span
                  className="status-badge"
                  style={{
                    background: "white",
                    color: "var(--primary)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Profile Edit Form */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#475569",
                  }}>
                  {t("settings.fullName") || "Full Name"}
                </label>
                <input
                  type="text"
                  className="search-bar"
                  style={{
                    width: "100%",
                    background: "#F8FAFC",
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: "12px",
                    outline: "none",
                  }}
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#475569",
                  }}>
                  {t("settings.phone") || "Phone Number"}
                </label>
                <input
                  type="text"
                  className="search-bar"
                  style={{
                    width: "100%",
                    background: "#F8FAFC",
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: "12px",
                    outline: "none",
                  }}
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#475569",
                  }}>
                  {t("settings.avatarUrl") || "Avatar URL"}
                </label>
                <input
                  type="text"
                  className="search-bar"
                  style={{
                    width: "100%",
                    background: "#F8FAFC",
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: "12px",
                    outline: "none",
                  }}
                  value={profileForm.avatar}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, avatar: e.target.value })
                  }
                />
              </div>

              {profileSuccessMsg && (
                <div
                  style={{
                    color: "#059669",
                    background: "#ECFDF5",
                    padding: "12px",
                    borderRadius: "12px",
                    fontWeight: "600",
                  }}>
                  {profileSuccessMsg}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleProfileSave}
                disabled={savingProfile}
                style={{
                  height: "48px",
                  marginTop: "8px",
                  opacity: savingProfile ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}>
                <Save size={18} />{" "}
                {savingProfile
                  ? t("settings.saving") || "Saving..."
                  : t("settings.updateProfile") || "Update Profile"}
              </button>
            </div>
          </div>

          <div className="card">
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
              <Shield size={20} color="var(--primary)" />{" "}
              {t("settings.accountSecurity")}
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <button
                className="btn"
                onClick={() => setShowPwModal(true)}
                style={{
                  justifyContent: "flex-start",
                  background: "#F8FAFC",
                  color: "#1E293B",
                  padding: "16px 24px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}>
                <Lock size={18} style={{ marginRight: "12px", opacity: 0.6 }} />{" "}
                {t("settings.changePassword")}
              </button>
              <button
                className="btn"
                style={{
                  justifyContent: "flex-start",
                  background: "#F8FAFC",
                  color: "#1E293B",
                  padding: "16px 24px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}>
                <Shield
                  size={18}
                  style={{ marginRight: "12px", opacity: 0.6 }}
                />{" "}
                {t("settings.twoFactor")}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div className="card" style={{ height: "fit-content" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "24px",
              }}>
              {t("settings.systemPreferences")}
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    marginBottom: "10px",
                    color: "#475569",
                  }}>
                  {t("settings.lowStockThreshold")}
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}>
                  <input
                    type="number"
                    value={localState.lowStockThreshold}
                    onChange={(e) =>
                      setLocalState({
                        ...localState,
                        lowStockThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                    className="search-bar"
                    style={{
                      flex: 1,
                      background: "#F8FAFC",
                      border: "none",
                      padding: "14px 20px",
                    }}
                  />
                  <span style={{ fontWeight: "600", color: "#94A3B8" }}>
                    {t("settings.units")}
                  </span>
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    marginBottom: "10px",
                    color: "#475569",
                  }}>
                  {t("settings.expiryWarning")}
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}>
                  <input
                    type="number"
                    value={localState.expiryWarningDays}
                    onChange={(e) =>
                      setLocalState({
                        ...localState,
                        expiryWarningDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="search-bar"
                    style={{
                      flex: 1,
                      background: "#F8FAFC",
                      border: "none",
                      padding: "14px 20px",
                    }}
                  />
                  <span style={{ fontWeight: "600", color: "#94A3B8" }}>
                    {t("settings.daysBeforeExpiry")}
                  </span>
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    marginBottom: "10px",
                    color: "#475569",
                  }}>
                  {t("settings.preferredCurrency")}
                </label>
                <CustomSelect
                  value={localState.currency}
                  onChange={(val) =>
                    setLocalState({ ...localState, currency: val })
                  }
                  options={[
                    { value: "ETB", label: "Ethiopian Birr (ETB)" },
                    { value: "USD", label: "US Dollar (USD)" },
                    { value: "EUR", label: "Euro (EUR)" },
                  ]}
                />
              </div>
              <div style={{ marginTop: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    marginBottom: "10px",
                    color: "#475569",
                  }}>
                  {t("settings.preferredLanguage")}
                </label>
                <CustomSelect
                  value={localState.language}
                  onChange={(val) =>
                    setLocalState({ ...localState, language: val })
                  }
                  options={[
                    { value: "en", label: "English" },
                    { value: "am", label: "Amharic (አማርኛ)" },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginTop: "40px" }}>
              {successMsg && (
                <div
                  style={{
                    color: "#059669",
                    background: "#ECFDF5",
                    padding: "12px",
                    borderRadius: "12px",
                    marginBottom: "16px",
                    fontWeight: "600",
                  }}>
                  {successMsg}
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: "100%",
                  height: "56px",
                  fontSize: "1.05rem",
                  opacity: saving ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}>
                <Save size={20} />{" "}
                {saving ? t("settings.saving") : t("settings.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Change Password Modal ──────────────────────────────────────────────── */}
      {showPwModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPwModal(false)}
          style={{ zIndex: 9999 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "450px",
              padding: "32px",
              position: "relative",
              background: "white",
              borderRadius: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}>
            <button
              onClick={() => setShowPwModal(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94A3B8",
              }}>
              <X size={20} />
            </button>

            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: "800",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
              <Lock size={20} color="var(--primary)" />{" "}
              {t("settings.changePasswordTitle")}
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#475569",
                  }}>
                  {t("settings.currentPassword")}
                </label>
                <input
                  type="password"
                  className="search-bar"
                  style={{
                    width: "100%",
                    background: "#F8FAFC",
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: "12px",
                    outline: "none",
                  }}
                  value={pwForm.current}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, current: e.target.value })
                  }
                  autoFocus
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#475569",
                  }}>
                  {t("settings.newPassword")}
                </label>
                <input
                  type="password"
                  className="search-bar"
                  style={{
                    width: "100%",
                    background: "#F8FAFC",
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: "12px",
                    outline: "none",
                  }}
                  value={pwForm.newPw}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPw: e.target.value })
                  }
                />
              </div>

              {pwError && (
                <div
                  style={{
                    color: "#DC2626",
                    background: "#FEF2F2",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}>
                  {pwError}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={pwLoading || !pwForm.current || !pwForm.newPw}
                style={{
                  height: "48px",
                  marginTop: "8px",
                  opacity: pwLoading ? 0.7 : 1,
                  width: "100%",
                }}>
                {pwLoading
                  ? t("settings.updatingPassword")
                  : t("settings.updatePassword")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
