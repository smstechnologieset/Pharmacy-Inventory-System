import React, { useState, useEffect } from "react";
import {
  ShieldPlus,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const { login, loading: authLoading, error: authError, user } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLocalLoading(true);

    try {
      await login(email, password);
      setLocalLoading(false);
      navigate("/");
    } catch (error) {
      setLocalError(
        error.message || t("login.authFailed") || "Authentication failed",
      );
      setLocalLoading(false);
    }
  };

  const openResetModal = () => {
    setResetEmail(email);
    setResetError("");
    setResetSuccess("");
    setShowResetModal(true);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail.trim()) {
      setResetError(t("login.resetEmailRequired"));
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(t("login.resetEmailSent"));
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.code === "auth/invalid-email") {
        setResetError(t("login.resetInvalidEmail"));
      } else if (error.code === "auth/user-not-found") {
        setResetError(t("login.resetUserNotFound"));
      } else {
        setResetError(t("login.resetFailed"));
      }
    } finally {
      setResetLoading(false);
    }
  };

  const displayError = localError || authError;
  const isLoading = localLoading || authLoading;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#F8FAFC",
        fontFamily: "'Lexend', sans-serif",
      }}>
      {/* Left Side - Branding */}
      <div
        style={{
          flex: 1.2,
          background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "100px",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}>
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "300px",
            height: "300px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}></div>
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "50%",
          }}></div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
            position: "relative",
          }}>
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "12px",
              borderRadius: "18px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}>
            <ShieldPlus size={40} />
          </div>
          <span
            style={{
              fontSize: "2.4rem",
              fontWeight: "800",
              letterSpacing: "-0.025em",
            }}>
            PharmaCare
          </span>
        </div>

        <h1
          style={{
            color: "white",
            fontSize: "4.2rem",
            marginBottom: "32px",
            lineHeight: "1.05",
            fontWeight: "800",
            letterSpacing: "-0.04em",
            position: "relative",
          }}>
          Modern <br /> Pharmacy <br /> Solutions.
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            opacity: 0.9,
            maxWidth: "500px",
            lineHeight: "1.6",
            fontWeight: "400",
            position: "relative",
          }}>
          Simplified inventory management with real-time tracking, glowing
          analytics, and a vibrant user experience.
        </p>

        <div
          style={{
            marginTop: "64px",
            display: "flex",
            gap: "24px",
            position: "relative",
          }}>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "20px",
              borderRadius: "24px",
              backdropFilter: "blur(10px)",
            }}>
            <div style={{ fontWeight: "700", fontSize: "1.5rem" }}>99.9%</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
              Accuracy Rate
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "20px",
              borderRadius: "24px",
              backdropFilter: "blur(10px)",
            }}>
            <div style={{ fontWeight: "700", fontSize: "1.5rem" }}>24/7</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
              Real-time Sync
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "8px",
              }}>
              {t("login.welcomeBack")}
            </h1>
            <p
              style={{
                color: "#64748B",
                fontSize: "0.85rem",
                marginBottom: "32px",
              }}>
              {t("login.loginPrompt")}
            </p>
          </div>

          {displayError && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                marginBottom: "20px",
                backgroundColor: "#FEE2E2",
                borderRadius: "16px",
                border: "1px solid #FECACA",
              }}>
              <AlertCircle
                size={20}
                style={{ color: "#DC2626", marginTop: "2px", flexShrink: 0 }}
              />
              <div
                style={{
                  color: "#991B1B",
                  fontSize: "0.9rem",
                  lineHeight: "1.4",
                }}>
                {displayError}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Email Field */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginLeft: "4px",
                }}>
                {t("login.emailAddress")}
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={20}
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "18px 20px 18px 56px",
                    borderRadius: "20px",
                    border: "2px solid #F1F5F9",
                    background: "#F8FAFC",
                    outline: "none",
                    fontSize: "1rem",
                    transition: "all 0.3s",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0D9488";
                    e.target.style.background = "white";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(13, 148, 136, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#F1F5F9";
                    e.target.style.background = "#F8FAFC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <label
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: "#1E293B",
                    marginLeft: "4px",
                  }}>
                  {t("login.password")}
                </label>
                <button
                  type="button"
                  onClick={openResetModal}
                  style={{
                    fontSize: "0.85rem",
                    color: "#0D9488",
                    fontWeight: "700",
                    textDecoration: "none",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}>
                  {t("login.forgotPassword")}
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Lock
                  size={20}
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "18px 56px 18px 56px", // Increased right padding for the eye icon
                    borderRadius: "20px",
                    border: "2px solid #F1F5F9",
                    background: "#F8FAFC",
                    outline: "none",
                    fontSize: "1rem",
                    transition: "all 0.3s",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0D9488";
                    e.target.style.background = "white";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(13, 148, 136, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#F1F5F9";
                    e.target.style.background = "#F8FAFC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="••••••••"
                  required
                />
                {/* Eye Icon Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                height: "64px",
                fontSize: "1.1rem",
                borderRadius: "20px",
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                backgroundColor: "#0D9488",
                color: "white",
                border: "none",
                fontWeight: "700",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.3s",
              }}
              disabled={isLoading || authLoading}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.backgroundColor = "#0B8A7D";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#0D9488";
              }}>
              {isLoading ? t("login.loading") : t("login.signIntoAccount")}
              {!isLoading && <ArrowRight size={22} />}
            </button>
          </form>

          {/* Navigate to Signup */}
          <div
            style={{
              textAlign: "center",
              marginTop: "48px",
              color: "#64748B",
              fontSize: "0.95rem",
            }}>
            {t("login.dontHaveAccount")}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              style={{
                color: "#0D9488",
                fontWeight: "700",
                textDecoration: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "inherit",
                marginLeft: "4px",
              }}>
              {t("login.signUp")}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal (Unchanged) */}
      {showResetModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowResetModal(false)}
          style={{ zIndex: 9999 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "430px",
              padding: "32px",
              position: "relative",
              background: "white",
              borderRadius: "24px",
            }}>
            <button
              onClick={() => setShowResetModal(false)}
              title={t("modal.close")}
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
                marginBottom: "8px",
                color: "#0F172A",
              }}>
              {t("login.resetPasswordTitle")}
            </h2>
            <p
              style={{
                color: "#64748B",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                marginBottom: "24px",
              }}>
              {t("login.resetPasswordSubtitle")}
            </p>

            <form
              onSubmit={handlePasswordReset}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#1E293B",
                  }}>
                  {t("login.emailAddress")}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="search-bar"
                  style={{
                    width: "100%",
                    background: "#F8FAFC",
                    padding: "14px 18px",
                  }}
                  autoFocus
                />
              </div>

              {resetError && (
                <div
                  style={{
                    color: "#DC2626",
                    background: "#FEF2F2",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}>
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div
                  style={{
                    color: "#059669",
                    background: "#ECFDF5",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}>
                  {resetSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowResetModal(false)}
                  style={{
                    flex: 1,
                    background: "#F8FAFC",
                    color: "#475569",
                    border: "1px solid #E2E8F0",
                  }}>
                  {t("modal.cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetLoading}
                  style={{ flex: 1, opacity: resetLoading ? 0.7 : 1 }}>
                  {resetLoading
                    ? t("login.sendingReset")
                    : t("login.sendResetLink")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
