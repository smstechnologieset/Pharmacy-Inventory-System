import React, { useState, useEffect } from "react";
import { User, Shield, Lock, Smartphone, Save, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../services/firestoreService";
import { useSettings } from "../context/SettingsContext";
import CustomSelect from "../components/CustomSelect";

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

  useEffect(() => {
    setLocalState({
      currency: contextSettings.currency || "ETB",
      language: contextSettings.language || "en",
      lowStockThreshold: contextSettings.lowStockThreshold || 10,
      expiryWarningDays: contextSettings.expiryWarningDays || 60,
    });
  }, [contextSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const { language, ...globalPayload } = localState;
      await updateSystemSettings(globalPayload);
      updateLanguage(language);
      setSuccessMsg(t("settings.successMsg"));
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
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
              <User size={20} color="var(--primary)" /> {t("settings.profileInfo")}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                padding: "24px",
                background: "var(--primary-light)",
                borderRadius: "24px",
                border: "1px solid rgba(13, 148, 136, 0.1)",
              }}>
              <img
                src={user?.avatar}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "4px solid white",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
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
              <Shield size={20} color="var(--primary)" /> {t("settings.accountSecurity")}
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <button
                className="btn"
                style={{
                  justifyContent: "flex-start",
                  background: "#F8FAFC",
                  color: "#1E293B",
                  padding: "16px 24px",
                  borderRadius: "16px",
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
                  onChange={(val) => setLocalState({ ...localState, currency: val })}
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
                  onChange={(val) => setLocalState({ ...localState, language: val })}
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
                }}>
                <Save size={20} style={{ marginRight: "8px" }} />{" "}
                {saving ? t("settings.saving") : t("settings.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
