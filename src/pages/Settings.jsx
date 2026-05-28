import React, { useState, useEffect } from "react";
import { User, Shield, Lock, Smartphone, Save, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../services/firestoreService";

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    currency: "ETB",
    language: "en",
    lowStockThreshold: 10,
    expiryWarningDays: 60,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getSystemSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      await updateSystemSettings(settings);
      setSuccessMsg("Settings saved successfully!");
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
          Settings & Profile
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginTop: "4px",
          }}>
          Customize your experience and system thresholds.
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
              <User size={20} color="var(--primary)" /> Profile Information
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
              <Shield size={20} color="var(--primary)" /> Account Security
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
                Change Password (Requires Admin SDK)
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
                Two-Factor Authentication
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
              System Preferences & Thresholds
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
                  Low Stock Notification Threshold
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}>
                  <input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
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
                    units
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
                  Expiry Warning Window
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}>
                  <input
                    type="number"
                    value={settings.expiryWarningDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
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
                    days before expiry
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
                  Preferred Currency
                </label>
                <select
                  className="search-bar"
                  value={settings.currency}
                  onChange={(e) =>
                    setSettings({ ...settings, currency: e.target.value })
                  }
                  style={{
                    width: "100%",
                    appearance: "auto",
                    background: "#F8FAFC",
                    border: "none",
                    padding: "14px 20px",
                  }}>
                  <option value="ETB">Ethiopian Birr (ETB)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
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
                {saving ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
