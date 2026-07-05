import React, { useState, useEffect } from "react";
import {
  ShieldPlus,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  User,
  Phone,
  Building2,
  Eye,
  EyeOff,
  FileText,
  Upload,
  CheckCircle2,
  CreditCard,
  MapPin,
  Globe,
  Check,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { initializePayment } from "../services/payment.js";
import InputField from "../components/InputField.jsx";
import AccountCreationForm from "../components/AccountCreationForm.jsx";
import PharmacyDetailsForm from "../components/PharmacyDetailsForm.jsx";
import BusinessLocationForm from "../components/BusinessLocationForm.jsx";
import SubscriptionSelectionForm from "../components/SubscriptionSelectionForm.jsx";
import DocumentUploadForm from "../components/DocumentUploadForm.jsx";
import TermsAndConfirmationForm from "./TermsAndConfirmationForm.jsx";

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    pharmacyName: "",
    licenseNumber: "",
    taxId: "",
    pharmacyType: "Retail",
    address: { street: "", city: "", state: "", zip: "", country: "Ethiopia" },
    businessEmail: "",
    businessPhone: "",
    website: "",
    selectedTier: "starter",
    billingCycle: "monthly",
    documents: { pharmacyLicense: null, pharmacistLicense: null },
    acceptTerms: false,
    acceptPrivacy: false,
    newsletter: false,
  });

  const {
    createAccount,
    finalizeRegistration,
    user,
    loading: authLoading,
    error: authError,
  } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (user && user.pharmacyId) {
  //     navigate("/");
  //   }
  // }, [user, navigate]);

  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const updateAddress = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));

  const nextStep = () => {
    setLocalError("");
    setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => {
    setLocalError("");
    setCurrentStep((prev) => prev - 1);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (value.startsWith("+251")) value = value.substring(4);
    else if (value.startsWith("0")) value = value.substring(1);
    updateField("phone", value);
  };

  const handleStepOneSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLocalLoading(true);
    try {
      if (!formData.name.trim()) throw new Error("Name is required");
      if (!formData.phone.trim()) throw new Error("Phone number is required");
      if (!/^9\d{8}$/.test(formData.phone))
        throw new Error("Invalid Ethiopian phone number");
      if (formData.password !== formData.confirmPassword)
        throw new Error("Passwords do not match");
      if (formData.password.length < 6)
        throw new Error("Password must be at least 6 characters");

      await createAccount(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
      );
      nextStep();
    } catch (error) {
      setLocalError(error.message || "Authentication failed");
    } finally {
      setLocalLoading(false);
    }
  };
  
  
  const handleFinalSubmit = async () => {
    setLocalError("");
    setLocalLoading(true);
    try {
      if (!formData.acceptTerms) {
        throw new Error("You must accept the Terms of Service to continue");
      }

      const payload = {
        pharmacyData: { ...formData }, // Adjust as needed for your backend
        subscriptionData: { ...formData },
        documents: { ...formData.documents },
      };

      // 1. Finalize Registration (Creates Pharmacy in DB)
      // The backend now uses 'verifyToken' so this won't 403.
      const result = await finalizeRegistration(payload);
      const newPharmacyId = result.pharmacyId;

      // 2. Initialize Payment (Creates Chapa Transaction)
      const { checkoutUrl, txRef } = await initializePayment(
        formData.billingCycle,
      );

      // 3. Store ref and Redirect
      sessionStorage.setItem("pending_payment_txRef", txRef);

      // 🚨 EXPLICIT REDIRECT: No useEffect race conditions
      window.location.href = checkoutUrl;
    } catch (error) {
      // Only show error if we are still on the page (not redirected)
      console.error(error);
      setLocalError(error.message || "Registration failed");
    } finally {
      // Only turn off loading if we haven't redirected
      if (!window.location.href.includes("checkout")) {
        setLocalLoading(false);
      }
    }
  };

  // const handleFinalSubmit = async () => {
  //   setLocalError("");
  //   setLocalLoading(true);
  //   try {
  //     if (!formData.acceptTerms) {
  //       throw new Error("You must accept the Terms of Service to continue");
  //     }

  //     const payload = {
  //       pharmacyData: {
  //         pharmacyName: formData.pharmacyName,
  //         phone: `+251${formData.phone}`,
  //         email: formData.email,
  //         licenseNumber: formData.licenseNumber,
  //         taxId: formData.taxId,
  //         pharmacyType: formData.pharmacyType,
  //         address: formData.address,
  //         businessEmail: formData.businessEmail,
  //         businessPhone: formData.businessPhone
  //           ? `+251${formData.businessPhone}`
  //           : "",
  //         website: formData.website,
  //       },
  //       subscriptionData: {
  //         selectedTier: formData.selectedTier,
  //         billingCycle: formData.billingCycle,
  //       },
  //       documents: {
  //         pharmacyLicense: formData.documents.pharmacyLicense
  //           ? "pending_upload"
  //           : null,
  //         pharmacistLicense: formData.documents.pharmacistLicense
  //           ? "pending_upload"
  //           : null,
  //       },
  //     };

  //     // Step 6: Create pharmacy (status: pending, subscription.status: pending_payment)
  //     await finalizeRegistration(payload);

  //     // Step 7: Initialize payment with Chapa
  //     const { checkoutUrl, txRef } = await initializePayment(
  //       formData.billingCycle,
  //     );

  //     // Store txRef for verification after redirect
  //     sessionStorage.setItem("pending_payment_txRef", txRef);

  //     // Redirect to Chapa payment page
  //     window.location.href = checkoutUrl;
  //   } catch (error) {
  //     setLocalError(error.message || "Registration failed");
  //   } finally {
  //     setLocalLoading(false);
  //   }
  // };

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
      {" "}
      {/* LEFT SIDE BRANDING */}
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
            <ShieldPlus size={40} />{" "}
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
            {" "}
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
      {/* RIGHT SIDE FORM */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 60px",
          overflowY: "auto",
        }}>
        <div style={{ width: "100%", maxWidth: "500px", padding: "20px 0" }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: "32px", display: "flex", gap: "8px" }}>
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: "6px",
                  borderRadius: "3px",
                  background: step <= currentStep ? "#0D9488" : "#E2E8F0",
                  transition: "all 0.3s",
                }}
              />
            ))}
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

          {/* Render Current Step */}
          {currentStep === 1 && (
            <AccountCreationForm
              formData={formData}
              updateField={updateField}
              handlePhoneChange={handlePhoneChange}
              isPhoneFocused={isPhoneFocused}
              setIsPhoneFocused={setIsPhoneFocused}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              onSubmit={handleStepOneSubmit}
              isLoading={isLoading}
            />
          )}
          {currentStep === 2 && (
            <PharmacyDetailsForm
              formData={formData}
              updateField={updateField}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <BusinessLocationForm
              formData={formData}
              updateField={updateField}
              updateAddress={updateAddress}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <SubscriptionSelectionForm
              formData={formData}
              updateField={updateField}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && (
            <DocumentUploadForm
              formData={formData}
              updateField={updateField}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 6 && (
            <TermsAndConfirmationForm
              formData={formData}
              updateField={updateField}
              onSubmit={handleFinalSubmit}
              onBack={prevStep}
              isLoading={isLoading}
            />
          )}

          {/* Footer Nav */}
          <div
            style={{
              textAlign: "center",
              marginTop: "32px",
              color: "#64748B",
              fontSize: "0.95rem",
            }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                color: "#0D9488",
                fontWeight: "700",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "inherit",
              }}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
