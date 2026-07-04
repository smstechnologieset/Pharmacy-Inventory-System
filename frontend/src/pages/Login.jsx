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
  const [showPassword, setShowPassword] = useState(false);
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
      if (error.message === "__unverified__") {        navigate("/verify-email");
      } else {
        setLocalError(error.message || "Authentication failed");
      }
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
      className="min-h-screen flex flex-col md:flex-row bg-slate-50"
      style={{ fontFamily: "'Lexend', sans-serif" }}    >
      {/* 📱 MOBILE HEADER (Visible only on small screens) */}
      <div className="md:hidden bg-gradient-to-br from-teal-600 to-teal-500 text-white p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-white/20 p-2 rounded-xl">
            <ShieldPlus size={28} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">PharmaCare</span>
        </div>
        <p className="text-sm opacity-90">Modern Pharmacy Solutions</p>
      </div>

      {/* 💻 LEFT SIDE - BRANDING (Desktop only) */}
      <div className="hidden md:flex md:flex-[1.2] bg-gradient-to-br from-teal-600 to-teal-500 flex-col justify-center p-16 lg:p-24 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full"></div>

        <div className="flex items-center gap-4 mb-12 relative">
          <div className="bg-white/20 p-3 rounded-2xl shadow-lg">
            <ShieldPlus size={40} />
          </div>
          <span className="text-4xl font-extrabold tracking-tight">PharmaCare</span>
        </div>

        <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-8 relative">
          Modern <br /> Pharmacy <br /> Solutions.
        </h1>

        <p className="text-xl opacity-90 max-w-md leading-relaxed relative">
          Simplified inventory management with real-time tracking, glowing analytics, and a vibrant user experience.
        </p>

        <div className="mt-16 flex gap-6 relative">
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
            <div className="font-bold text-2xl">99.9%</div>
            <div className="text-sm opacity-80">Accuracy Rate</div>
          </div>
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
            <div className="font-bold text-2xl">24/7</div>
            <div className="text-sm opacity-80">Real-time Sync</div>
          </div>
        </div>
      </div>

      {/* 🔐 RIGHT SIDE - FORM */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">
              {t("login.welcomeBack")}            </h1>
            <p className="text-slate-500 text-sm">
              {t("login.loginPrompt")}
            </p>
          </div>

          {displayError && (
            <div className="flex items-start gap-3 p-4 mb-5 bg-red-50 rounded-2xl border border-red-100">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-red-800 text-sm leading-relaxed">
                {displayError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Email Field */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-bold text-slate-800 ml-1">
                {t("login.emailAddress")}
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-4 pl-14 pr-5 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none text-base transition-all focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-800 ml-1">
                  {t("login.password")}
                </label>
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-sm text-teal-600 font-bold hover:text-teal-700 transition"
                >
                  {t("login.forgotPassword")}
                </button>
              </div>
              <div className="relative">
                <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-4 pl-14 pr-14 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none text-base transition-all focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full h-16 text-lg font-bold rounded-2xl mt-4 flex items-center justify-center gap-3 bg-teal-600 text-white border-none transition-all hover:bg-teal-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20"
            >
              {isLoading ? t("login.loading") : t("login.signIntoAccount")}
              {!isLoading && <ArrowRight size={22} />}
            </button>
          </form>

          {/* Navigate to Signup */}
          <div className="text-center mt-12 text-slate-500 text-base">
            {t("login.dontHaveAccount")}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-teal-600 font-bold hover:text-teal-700 transition ml-1"
            >
              {t("login.signUp")}
            </button>
          </div>
        </div>
      </div>

      {/* 🔁 RESET PASSWORD MODAL */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowResetModal(false)}
        >          <div
            className="w-full max-w-md bg-white rounded-3xl p-8 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 mb-2">
              {t("login.resetPasswordTitle")}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              {t("login.resetPasswordSubtitle")}
            </p>

            <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  {t("login.emailAddress")}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-teal-600 focus:bg-white transition"
                  autoFocus
                />
              </div>

              {resetError && (
                <div className="text-red-600 bg-red-50 p-3 rounded-xl text-sm font-semibold">
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="text-emerald-600 bg-emerald-50 p-3 rounded-xl text-sm font-semibold">
                  {resetSuccess}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >                  {t("modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 transition disabled:opacity-70"
                >
                  {resetLoading ? t("login.sendingReset") : t("login.sendResetLink")}
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


// import React, { useState, useEffect } from "react";
// import {
//   ShieldPlus,
//   Mail,
//   Lock,
//   ArrowRight,
//   AlertCircle,
//   X,
//   Eye,
//   EyeOff,
// } from "lucide-react";
// import { sendPasswordResetEmail } from "firebase/auth";
// import { useAuth } from "../context/AuthContext";
// import { useSettings } from "../context/SettingsContext";
// import { useNavigate } from "react-router-dom";
// import { auth } from "../services/firebase";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false); // New state for password visibility
//   const [localError, setLocalError] = useState("");
//   const [localLoading, setLocalLoading] = useState(false);
//   const [showResetModal, setShowResetModal] = useState(false);
//   const [resetEmail, setResetEmail] = useState("");
//   const [resetLoading, setResetLoading] = useState(false);
//   const [resetError, setResetError] = useState("");
//   const [resetSuccess, setResetSuccess] = useState("");

//   const { login, loading: authLoading, error: authError, user } = useAuth();
//   const { t } = useSettings();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (user) {
//       navigate("/");
//     }
//   }, [user, navigate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLocalError("");
//     setLocalLoading(true);

//     try {
//       await login(email, password);
//       setLocalLoading(false);
//       navigate("/");
//     } catch ( error ) {
//       if (error.message === "__unverified__") {
//         navigate("/verify-email");
//       } else {
//         setLocalError(error.message || "Authentication failed");
//       }
//       setLocalLoading(false);
//     }
//   };

//   const openResetModal = () => {
//     setResetEmail(email);
//     setResetError("");
//     setResetSuccess("");
//     setShowResetModal(true);
//   };

//   const handlePasswordReset = async (e) => {
//     e.preventDefault();
//     setResetError("");
//     setResetSuccess("");

//     if (!resetEmail.trim()) {
//       setResetError(t("login.resetEmailRequired"));
//       return;
//     }

//     setResetLoading(true);
//     try {
//       await sendPasswordResetEmail(auth, resetEmail.trim());
//       setResetSuccess(t("login.resetEmailSent"));
//     } catch (error) {
//       console.error("Password reset error:", error);
//       if (error.code === "auth/invalid-email") {
//         setResetError(t("login.resetInvalidEmail"));
//       } else if (error.code === "auth/user-not-found") {
//         setResetError(t("login.resetUserNotFound"));
//       } else {
//         setResetError(t("login.resetFailed"));
//       }
//     } finally {
//       setResetLoading(false);
//     }
//   };

//   const displayError = localError || authError;
//   const isLoading = localLoading || authLoading;

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         background: "#F8FAFC",
//         fontFamily: "'Lexend', sans-serif",
//       }}>
//       {/* Left Side - Branding */}
//       <div
//         style={{
//           flex: 1.2,
//           background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "center",
//           padding: "100px",
//           color: "white",
//           position: "relative",
//           overflow: "hidden",
//         }}>
//         <div
//           style={{
//             position: "absolute",
//             top: "-100px",
//             left: "-100px",
//             width: "300px",
//             height: "300px",
//             background: "rgba(255,255,255,0.1)",
//             borderRadius: "50%",
//           }}></div>
//         <div
//           style={{
//             position: "absolute",
//             bottom: "-50px",
//             right: "-50px",
//             width: "200px",
//             height: "200px",
//             background: "rgba(255,255,255,0.05)",
//             borderRadius: "50%",
//           }}></div>

//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "16px",
//             marginBottom: "48px",
//             position: "relative",
//           }}>
//           <div
//             style={{
//               background: "rgba(255,255,255,0.2)",
//               padding: "12px",
//               borderRadius: "18px",
//               boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
//             }}>
//             <ShieldPlus size={40} />
//           </div>
//           <span
//             style={{
//               fontSize: "2.4rem",
//               fontWeight: "800",
//               letterSpacing: "-0.025em",
//             }}>
//             PharmaCare
//           </span>
//         </div>

//         <h1
//           style={{
//             color: "white",
//             fontSize: "4.2rem",
//             marginBottom: "32px",
//             lineHeight: "1.05",
//             fontWeight: "800",
//             letterSpacing: "-0.04em",
//             position: "relative",
//           }}>
//           Modern <br /> Pharmacy <br /> Solutions.
//         </h1>

//         <p
//           style={{
//             fontSize: "1.2rem",
//             opacity: 0.9,
//             maxWidth: "500px",
//             lineHeight: "1.6",
//             fontWeight: "400",
//             position: "relative",
//           }}>
//           Simplified inventory management with real-time tracking, glowing
//           analytics, and a vibrant user experience.
//         </p>

//         <div
//           style={{
//             marginTop: "64px",
//             display: "flex",
//             gap: "24px",
//             position: "relative",
//           }}>
//           <div
//             style={{
//               background: "rgba(255,255,255,0.1)",
//               padding: "20px",
//               borderRadius: "24px",
//               backdropFilter: "blur(10px)",
//             }}>
//             <div style={{ fontWeight: "700", fontSize: "1.5rem" }}>99.9%</div>
//             <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
//               Accuracy Rate
//             </div>
//           </div>
//           <div
//             style={{
//               background: "rgba(255,255,255,0.1)",
//               padding: "20px",
//               borderRadius: "24px",
//               backdropFilter: "blur(10px)",
//             }}>
//             <div style={{ fontWeight: "700", fontSize: "1.5rem" }}>24/7</div>
//             <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
//               Real-time Sync
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Side - Form */}
//       <div
//         style={{
//           flex: 1,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           padding: "60px",
//         }}>
//         <div style={{ width: "100%", maxWidth: "440px" }}>
//           <div style={{ marginBottom: "40px" }}>
//             <h1
//               style={{
//                 fontSize: "1.5rem",
//                 fontWeight: "800",
//                 color: "#1E293B",
//                 marginBottom: "8px",
//               }}>
//               {t("login.welcomeBack")}
//             </h1>
//             <p
//               style={{
//                 color: "#64748B",
//                 fontSize: "0.85rem",
//                 marginBottom: "32px",
//               }}>
//               {t("login.loginPrompt")}
//             </p>
//           </div>

//           {displayError && (
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "flex-start",
//                 gap: "12px",
//                 padding: "14px 16px",
//                 marginBottom: "20px",
//                 backgroundColor: "#FEE2E2",
//                 borderRadius: "16px",
//                 border: "1px solid #FECACA",
//               }}>
//               <AlertCircle
//                 size={20}
//                 style={{ color: "#DC2626", marginTop: "2px", flexShrink: 0 }}
//               />
//               <div
//                 style={{
//                   color: "#991B1B",
//                   fontSize: "0.9rem",
//                   lineHeight: "1.4",
//                 }}>
//                 {displayError}
//               </div>
//             </div>
//           )}

//           <form
//             onSubmit={handleSubmit}
//             style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
//             {/* Email Field */}
//             <div
//               style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//               <label
//                 style={{
//                   fontSize: "0.95rem",
//                   fontWeight: "700",
//                   color: "#1E293B",
//                   marginLeft: "4px",
//                 }}>
//                 {t("login.emailAddress")}
//               </label>
//               <div style={{ position: "relative" }}>
//                 <Mail
//                   size={20}
//                   style={{
//                     position: "absolute",
//                     left: "20px",
//                     top: "50%",
//                     transform: "translateY(-50%)",
//                     color: "#94A3B8",
//                   }}
//                 />
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   style={{
//                     width: "100%",
//                     padding: "18px 20px 18px 56px",
//                     borderRadius: "20px",
//                     border: "2px solid #F1F5F9",
//                     background: "#F8FAFC",
//                     outline: "none",
//                     fontSize: "1rem",
//                     transition: "all 0.3s",
//                     fontFamily: "inherit",
//                   }}
//                   onFocus={(e) => {
//                     e.target.style.borderColor = "#0D9488";
//                     e.target.style.background = "white";
//                     e.target.style.boxShadow =
//                       "0 0 0 4px rgba(13, 148, 136, 0.1)";
//                   }}
//                   onBlur={(e) => {
//                     e.target.style.borderColor = "#F1F5F9";
//                     e.target.style.background = "#F8FAFC";
//                     e.target.style.boxShadow = "none";
//                   }}
//                   placeholder="name@company.com"
//                   required
//                 />
//               </div>
//             </div>

//             {/* Password Field */}
//             <div
//               style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}>
//                 <label
//                   style={{
//                     fontSize: "0.95rem",
//                     fontWeight: "700",
//                     color: "#1E293B",
//                     marginLeft: "4px",
//                   }}>
//                   {t("login.password")}
//                 </label>
//                 <button
//                   type="button"
//                   onClick={openResetModal}
//                   style={{
//                     fontSize: "0.85rem",
//                     color: "#0D9488",
//                     fontWeight: "700",
//                     textDecoration: "none",
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     padding: 0,
//                   }}>
//                   {t("login.forgotPassword")}
//                 </button>
//               </div>
//               <div style={{ position: "relative" }}>
//                 <Lock
//                   size={20}
//                   style={{
//                     position: "absolute",
//                     left: "20px",
//                     top: "50%",
//                     transform: "translateY(-50%)",
//                     color: "#94A3B8",
//                   }}
//                 />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   style={{
//                     width: "100%",
//                     padding: "18px 56px 18px 56px", // Increased right padding for the eye icon
//                     borderRadius: "20px",
//                     border: "2px solid #F1F5F9",
//                     background: "#F8FAFC",
//                     outline: "none",
//                     fontSize: "1rem",
//                     transition: "all 0.3s",
//                     fontFamily: "inherit",
//                   }}
//                   onFocus={(e) => {
//                     e.target.style.borderColor = "#0D9488";
//                     e.target.style.background = "white";
//                     e.target.style.boxShadow =
//                       "0 0 0 4px rgba(13, 148, 136, 0.1)";
//                   }}
//                   onBlur={(e) => {
//                     e.target.style.borderColor = "#F1F5F9";
//                     e.target.style.background = "#F8FAFC";
//                     e.target.style.boxShadow = "none";
//                   }}
//                   placeholder="••••••••"
//                   required
//                 />
//                 {/* Eye Icon Toggle Button */}
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   style={{
//                     position: "absolute",
//                     right: "20px",
//                     top: "50%",
//                     transform: "translateY(-50%)",
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     color: "#94A3B8",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     padding: 0,
//                   }}
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               className="btn btn-primary"
//               style={{
//                 width: "100%",
//                 height: "64px",
//                 fontSize: "1.1rem",
//                 borderRadius: "20px",
//                 marginTop: "16px",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 gap: "12px",
//                 backgroundColor: "#0D9488",
//                 color: "white",
//                 border: "none",
//                 fontWeight: "700",
//                 cursor: isLoading ? "not-allowed" : "pointer",
//                 opacity: isLoading ? 0.7 : 1,
//                 transition: "all 0.3s",
//               }}
//               disabled={isLoading || authLoading}
//               onMouseEnter={(e) => {
//                 if (!isLoading) e.target.style.backgroundColor = "#0B8A7D";
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.backgroundColor = "#0D9488";
//               }}>
//               {isLoading ? t("login.loading") : t("login.signIntoAccount")}
//               {!isLoading && <ArrowRight size={22} />}
//             </button>
//           </form>

//           {/* Navigate to Signup */}
//           <div
//             style={{
//               textAlign: "center",
//               marginTop: "48px",
//               color: "#64748B",
//               fontSize: "0.95rem",
//             }}>
//             {t("login.dontHaveAccount")}
//             <button
//               type="button"
//               onClick={() => navigate("/signup")}
//               style={{
//                 color: "#0D9488",
//                 fontWeight: "700",
//                 textDecoration: "none",
//                 background: "none",
//                 border: "none",
//                 cursor: "pointer",
//                 fontSize: "inherit",
//                 marginLeft: "4px",
//               }}>
//               {t("login.signUp")}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Reset Password Modal (Unchanged) */}
//       {showResetModal && (
//         <div
//           className="modal-overlay"
//           onClick={() => setShowResetModal(false)}
//           style={{ zIndex: 9999 }}>
//           <div
//             className="modal-content"
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               maxWidth: "430px",
//               padding: "32px",
//               position: "relative",
//               background: "white",
//               borderRadius: "24px",
//             }}>
//             <button
//               onClick={() => setShowResetModal(false)}
//               title={t("modal.close")}
//               style={{
//                 position: "absolute",
//                 top: "20px",
//                 right: "20px",
//                 background: "none",
//                 border: "none",
//                 cursor: "pointer",
//                 color: "#94A3B8",
//               }}>
//               <X size={20} />
//             </button>

//             <h2
//               style={{
//                 fontSize: "1.2rem",
//                 fontWeight: "800",
//                 marginBottom: "8px",
//                 color: "#0F172A",
//               }}>
//               {t("login.resetPasswordTitle")}
//             </h2>
//             <p
//               style={{
//                 color: "#64748B",
//                 fontSize: "0.9rem",
//                 lineHeight: "1.5",
//                 marginBottom: "24px",
//               }}>
//               {t("login.resetPasswordSubtitle")}
//             </p>

//             <form
//               onSubmit={handlePasswordReset}
//               style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//               <div>
//                 <label
//                   style={{
//                     display: "block",
//                     fontSize: "0.9rem",
//                     fontWeight: "700",
//                     marginBottom: "8px",
//                     color: "#1E293B",
//                   }}>
//                   {t("login.emailAddress")}
//                 </label>
//                 <input
//                   type="email"
//                   value={resetEmail}
//                   onChange={(e) => setResetEmail(e.target.value)}
//                   placeholder={t("login.emailPlaceholder")}
//                   className="search-bar"
//                   style={{
//                     width: "100%",
//                     background: "#F8FAFC",
//                     padding: "14px 18px",
//                   }}
//                   autoFocus
//                 />
//               </div>

//               {resetError && (
//                 <div
//                   style={{
//                     color: "#DC2626",
//                     background: "#FEF2F2",
//                     padding: "10px 12px",
//                     borderRadius: "10px",
//                     fontSize: "0.85rem",
//                     fontWeight: "600",
//                   }}>
//                   {resetError}
//                 </div>
//               )}
//               {resetSuccess && (
//                 <div
//                   style={{
//                     color: "#059669",
//                     background: "#ECFDF5",
//                     padding: "10px 12px",
//                     borderRadius: "10px",
//                     fontSize: "0.85rem",
//                     fontWeight: "600",
//                   }}>
//                   {resetSuccess}
//                 </div>
//               )}

//               <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
//                 <button
//                   type="button"
//                   className="btn"
//                   onClick={() => setShowResetModal(false)}
//                   style={{
//                     flex: 1,
//                     background: "#F8FAFC",
//                     color: "#475569",
//                     border: "1px solid #E2E8F0",
//                   }}>
//                   {t("modal.cancel")}
//                 </button>
//                 <button
//                   type="submit"
//                   className="btn btn-primary"
//                   disabled={resetLoading}
//                   style={{ flex: 1, opacity: resetLoading ? 0.7 : 1 }}>
//                   {resetLoading
//                     ? t("login.sendingReset")
//                     : t("login.sendResetLink")}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Login;
