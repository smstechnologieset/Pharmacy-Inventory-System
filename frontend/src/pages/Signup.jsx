import React, { useState, useEffect } from "react";
import {
  ShieldPlus,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  User,
  Phone,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // States for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for phone input focus styling
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const { signup, loading: authLoading, error: authError, user } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Handle phone input changes and auto-strip country code/leading zero
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // If user pastes or types +251 at the beginning, strip it
    if (value.startsWith("+251")) {
      value = value.substring(4);
    } 
    // If user types 0 at the beginning, strip it
    else if (value.startsWith("0")) {
      value = value.substring(1);
    }
    setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLocalLoading(true);

    try {
      if (!name.trim()) {
        throw new Error(t("login.nameRequired") || "Name is required");
      }
      if (!pharmacyName.trim()) {
        throw new Error("Pharmacy name is required");
      }
      if (!phone.trim()) {
        throw new Error(t("login.phoneRequired") || "Phone number is required");
      }

      // --- ETHIOPIAN PHONE NUMBER VALIDATION ---
      // Since the country code is handled by the UI, we only validate the 9-digit number
      const phoneRegex = /^9\d{8}$/;
      
      if (!phoneRegex.test(phone)) {
        throw new Error(
          "Invalid phone number. Please enter a valid 9-digit Ethiopian phone number (e.g., 911121314)."
        );
      }
      // -----------------------------------------

      if (password !== confirmPassword) {
        throw new Error(
          t("login.passwordsDoNotMatch") || "Passwords do not match",
        );
      }
      if (password.length < 6) {
        throw new Error(
          t("login.passwordTooShort") ||
            "Password must be at least 6 characters",
        );
      }

      // Pass the full international format (+251...) to the signup function
      await signup(email, password, name, "admin", `+251${phone}`, pharmacyName);

      setLocalLoading(false);
      navigate("/verify-email");
    } catch (error) {
      setLocalError(
        error.message || t("login.authFailed") || "Authentication failed",
      );
      setLocalLoading(false);
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
      {/* Left Side - Branding (Same as Login) */}
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
          overflowY: "auto",
        }}>
        <div style={{ width: "100%", maxWidth: "440px", padding: "20px 0" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#1E293B",
                marginBottom: "8px",
              }}>
              {t("login.createAccount") || "Create Account"}
            </h1>
            <p
              style={{
                color: "#64748B",
                fontSize: "0.85rem",
                marginBottom: "24px",
              }}>
              {t("login.signupPrompt") ||
                "Join us today and manage your pharmacy efficiently."}
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
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            
            {/* Name Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginLeft: "4px",
                }}>
                {t("login.fullName") || "Full Name"} <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User
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
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px 16px 56px",
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
                    e.target.style.boxShadow = "0 0 0 4px rgba(13, 148, 136, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#F1F5F9";
                    e.target.style.background = "#F8FAFC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Pharmacy Name Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginLeft: "4px",
                }}>
                Pharmacy Name <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Building2
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
                  type="text"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px 16px 56px",
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
                    e.target.style.boxShadow = "0 0 0 4px rgba(13, 148, 136, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#F1F5F9";
                    e.target.style.background = "#F8FAFC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="Pharmacy name"
                  required
                />
              </div>
            </div>

            {/* Phone Field (Unified Container) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginLeft: "4px",
                }}>
                {t("login.phoneNumber") || "Phone Number"} <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "20px",
                  border: `2px solid ${isPhoneFocused ? "#0D9488" : "#F1F5F9"}`,
                  background: isPhoneFocused ? "white" : "#F8FAFC",
                  boxShadow: isPhoneFocused ? "0 0 0 4px rgba(13, 148, 136, 0.1)" : "none",
                  transition: "all 0.3s",
                  overflow: "hidden"
                }}
              >
                {/* Phone Icon */}
                <div style={{ padding: "0 0 0 20px", color: "#94A3B8", display: "flex", alignItems: "center" }}>
                  <Phone size={20} />
                </div>
                
                {/* Country Code */}
                <div style={{
                  padding: "16px 12px",
                  fontWeight: "600",
                  color: "#1E293B",
                  borderRight: "2px solid #E2E8F0",
                  fontSize: "1rem",
                  userSelect: "none",
                  whiteSpace: "nowrap"
                }}>
                  +251
                </div>
                
                {/* Phone Input */}
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  style={{
                    flex: 1,
                    padding: "16px 20px 16px 16px",
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    minWidth: 0 // Prevents overflow on small screens
                  }}
                  placeholder="9XX XXX XXX"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginLeft: "4px",
                }}>
                {t("login.emailAddress") || "Email Address"} <span style={{ color: "#EF4444" }}>*</span>
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
                    padding: "16px 20px 16px 56px",
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
                    e.target.style.boxShadow = "0 0 0 4px rgba(13, 148, 136, 0.1)";
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
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginLeft: "4px",
                }}>
                {t("login.password") || "Password"} <span style={{ color: "#EF4444" }}>*</span>
              </label>
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
                    padding: "16px 56px 16px 56px",
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
                    e.target.style.boxShadow = "0 0 0 4px rgba(13, 148, 136, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#F1F5F9";
                    e.target.style.background = "#F8FAFC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="••••••••"
                  required
                />
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

            {/* Confirm Password Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginLeft: "4px",
                }}>
                {t("login.confirmPassword") || "Confirm Password"} <span style={{ color: "#EF4444" }}>*</span>
              </label>
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
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 56px 16px 56px",
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
                    e.target.style.boxShadow = "0 0 0 4px rgba(13, 148, 136, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#F1F5F9";
                    e.target.style.background = "#F8FAFC";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                height: "60px",
                fontSize: "1.05rem",
                borderRadius: "20px",
                marginTop: "8px",
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
              {isLoading
                ? t("login.loading") || "Loading..."
                : t("login.createAccount") || "Create Account"}
              {!isLoading && <ArrowRight size={22} />}
            </button>
          </form>

          {/* Navigate to Login */}
          <div
            style={{
              textAlign: "center",
              marginTop: "32px",
              color: "#64748B",
              fontSize: "0.95rem",
            }}>
            {t("login.alreadyHaveAccount") || "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                color: "#0D9488",
                fontWeight: "700",
                textDecoration: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "inherit",
              }}>
              {t("login.signIn") || "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
