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

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const InputField = ({
  icon: Icon,
  label,
  required,
  containerStyle,
  ...props
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      ...containerStyle,
    }}>
    <label
      style={{
        fontSize: "0.9rem",
        fontWeight: "700",
        color: "#1E293B",
        marginLeft: "4px",
      }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    <div style={{ position: "relative" }}>
      {Icon && (
        <Icon
          size={20}
          style={{
            position: "absolute",
            left: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94A3B8",
          }}
        />
      )}
      <input
        {...props}
        style={{
          width: "100%",
          padding: Icon ? "16px 20px 16px 56px" : "16px 20px",
          borderRadius: "20px",
          border: "2px solid #F1F5F9",
          background: "#F8FAFC",
          outline: "none",
          fontSize: "1rem",
          transition: "all 0.3s",
          fontFamily: "inherit",
          ...props.style,
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
      />
    </div>
  </div>
);

const FileUploadBox = ({ label, file, onFileChange }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <label
      style={{
        fontSize: "0.9rem",
        fontWeight: "700",
        color: "#1E293B",
        marginLeft: "4px",
      }}>
      {label}
    </label>
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        borderRadius: "20px",
        border: file ? "2px solid #0D9488" : "2px dashed #CBD5E1",
        background: file ? "#F0FDFA" : "#F8FAFC",
        cursor: "pointer",
        transition: "all 0.3s",
        gap: "12px",
      }}>
      <input
        type="file"
        hidden
        onChange={(e) => onFileChange(e.target.files[0])}
        accept=".pdf,.jpg,.png"
      />
      <div style={{ color: file ? "#0D9488" : "#94A3B8" }}>
        {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
      </div>
      <span
        style={{ fontWeight: "600", color: "#475569", textAlign: "center" }}>
        {file ? file.name : "Click to upload document"}
      </span>
      <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
        PDF, JPG, PNG (Max 5MB)
      </span>
    </label>
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      cursor: "pointer",
    }}>
    <div
      onClick={onChange}
      style={{
        width: "24px",
        height: "24px",
        borderRadius: "8px",
        flexShrink: 0,
        border: checked ? "2px solid #0D9488" : "2px solid #CBD5E1",
        background: checked ? "#0D9488" : "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        marginTop: "2px",
      }}>
      {checked && <Check size={16} color="white" strokeWidth={3} />}
    </div>
    <span style={{ fontSize: "0.9rem", color: "#475569", lineHeight: "1.5" }}>
      {label}
    </span>
  </label>
);

// ─── STEP COMPONENTS ──────────────────────────────────────────────────────────

const StepOne = ({
  formData,
  updateField,
  handlePhoneChange,
  isPhoneFocused,
  setIsPhoneFocused,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onSubmit,
  isLoading,
}) => (
  <form
    onSubmit={onSubmit}
    style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    <h2
      style={{
        fontSize: "1.5rem",
        fontWeight: "800",
        color: "#1E293B",
        marginBottom: "8px",
      }}>
      Create Your Account
    </h2>
    <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "16px" }}>
      Let's start with your basic information.
    </p>

    <InputField
      icon={User}
      label="Full Name"
      required
      value={formData.name}
      onChange={(e) => updateField("name", e.target.value)}
      placeholder="John Doe"
    />

    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: "20px",
        border: `2px solid ${isPhoneFocused ? "#0D9488" : "#F1F5F9"}`,
        background: isPhoneFocused ? "white" : "#F8FAFC",
        overflow: "hidden",
      }}>
      <div style={{ padding: "0 0 0 20px", color: "#94A3B8" }}>
        <Phone size={20} />
      </div>
      <div
        style={{
          padding: "16px 12px",
          fontWeight: "600",
          color: "#1E293B",
          borderRight: "2px solid #E2E8F0",
          fontSize: "1rem",
        }}>
        +251
      </div>
      <input
        type="tel"
        value={formData.phone}
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
        }}
        placeholder="9XX XXX XXX"
        required
      />{" "}
    </div>

    <InputField
      icon={Mail}
      label="Email Address"
      required
      type="email"
      value={formData.email}
      onChange={(e) => updateField("email", e.target.value)}
      placeholder="name@company.com"
    />

    <div style={{ position: "relative" }}>
      <InputField
        icon={Lock}
        label="Password"
        required
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={(e) => updateField("password", e.target.value)}
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: "absolute",
          right: "20px",
          top: "42px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94A3B8",
        }}>
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>

    <div style={{ position: "relative" }}>
      <InputField
        icon={Lock}
        label="Confirm Password"
        required
        type={showConfirmPassword ? "text" : "password"}
        value={formData.confirmPassword}
        onChange={(e) => updateField("confirmPassword", e.target.value)}
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        style={{
          position: "absolute",
          right: "20px",
          top: "42px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94A3B8",
        }}>
        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>

    <button
      type="submit"
      className="btn btn-primary"
      disabled={isLoading}
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
      }}>
      {isLoading ? "Creating Account..." : "Next Step"} <ArrowRight size={22} />
    </button>
  </form>
);

const StepTwo = ({ formData, updateField, onNext, onBack }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E293B" }}>
      Pharmacy Details
    </h2>
    <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "16px" }}>
      Tell us about your pharmacy.
    </p>

    <InputField
      icon={Building2}
      label="Pharmacy Name"
      required
      value={formData.pharmacyName}
      onChange={(e) => updateField("pharmacyName", e.target.value)}
      placeholder="Bole Community Pharmacy"
    />
    <InputField
      icon={FileText}
      label="Pharmacy License Number"
      required
      value={formData.licenseNumber}
      onChange={(e) => updateField("licenseNumber", e.target.value)}
      placeholder="e.g., PH/12345/2023"
    />
    <InputField
      icon={FileText}
      label="Tax ID / GST Number"
      value={formData.taxId}
      onChange={(e) => updateField("taxId", e.target.value)}
      placeholder="Optional"
    />

    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "0.9rem",
          fontWeight: "700",
          color: "#1E293B",
          marginLeft: "4px",
        }}>
        Pharmacy Type <span style={{ color: "#EF4444" }}>*</span>
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}>
        {["Retail", "Hospital", "Clinic", "Wholesale"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => updateField("pharmacyType", type)}
            style={{
              padding: "14px",
              borderRadius: "16px",
              border:
                formData.pharmacyType === type
                  ? "2px solid #0D9488"
                  : "2px solid #F1F5F9",
              background:
                formData.pharmacyType === type ? "#F0FDFA" : "#F8FAFC",
              color: formData.pharmacyType === type ? "#0D9488" : "#64748B",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s",
            }}>
            {type}
          </button>
        ))}
      </div>
    </div>

    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          flex: 1,
          height: "52px",
          borderRadius: "20px",
          border: "2px solid #E2E8F0",
          background: "white",
          color: "#64748B",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
        <ArrowLeft size={20} /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className="btn btn-primary"
        style={{
          flex: 2,
          height: "52px",
          borderRadius: "20px",
          backgroundColor: "#0D9488",
          color: "white",
          border: "none",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
        Next <ArrowRight size={20} />{" "}
      </button>
    </div>
  </div>
);

const StepThree = ({
  formData,
  updateField,
  updateAddress,
  onNext,
  onBack,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E293B" }}>
      Business Information
    </h2>
    <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "16px" }}>
      Where is your pharmacy located?
    </p>

    <InputField
      icon={MapPin}
      label="Street Address"
      required
      value={formData.address.street}
      onChange={(e) => updateAddress("street", e.target.value)}
      placeholder="123 Pharmacy Lane"
    />
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      <InputField
        label="City"
        required
        value={formData.address.city}
        onChange={(e) => updateAddress("city", e.target.value)}
        placeholder="Addis Ababa"
      />
      <InputField
        label="State/Region"
        value={formData.address.state}
        onChange={(e) => updateAddress("state", e.target.value)}
        placeholder="Bole"
      />
    </div>
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      <InputField
        label="Postal/ZIP Code"
        value={formData.address.zip}
        onChange={(e) => updateAddress("zip", e.target.value)}
        placeholder="1000"
      />
      <InputField
        label="Country"
        value={formData.address.country}
        onChange={(e) => updateAddress("country", e.target.value)}
        placeholder="Ethiopia"
      />
    </div>

    <InputField
      icon={Mail}
      label="Business Email"
      value={formData.businessEmail}
      onChange={(e) => updateField("businessEmail", e.target.value)}
      placeholder="contact@pharmacy.com"
    />
    <InputField
      icon={Globe}
      label="Website (Optional)"
      value={formData.website}
      onChange={(e) => updateField("website", e.target.value)}
      placeholder="www.pharmacy.com"
    />

    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          flex: 1,
          height: "52px",
          borderRadius: "20px",
          border: "2px solid #E2E8F0",
          background: "white",
          color: "#64748B",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
        <ArrowLeft size={20} /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className="btn btn-primary"
        style={{
          flex: 2,
          height: "52px",
          borderRadius: "20px",
          backgroundColor: "#0D9488",
          color: "white",
          border: "none",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
        Next <ArrowRight size={20} />
      </button>
    </div>
  </div>
);

const StepFour = ({ formData, updateField, onNext, onBack }) => {
  // 🚨 UPDATED: Added specific monthly and yearly prices based on your pricing tiers
  const tiers = [
    {
      id: "starter_fikir",
      name: "Starter",
      monthlyPrice: "1,500",
      yearlyPrice: "15,000", // 17% discount
      features: ["Up to 500 SKUs", "1 Branch", "1 User"],
    },
    {
      id: "growth_gizmo",
      name: "Growth",
      monthlyPrice: "3,000",
      yearlyPrice: "28,000", // ~22% discount
      features: ["Up to 2,000 SKUs", "2 Branches", "5 Users"],
      popular: true,
    },
    {
      id: "business_medipro",
      name: "Business",
      monthlyPrice: "5,000",
      yearlyPrice: "42,000", // ~30% discount
      features: ["Unlimited SKUs", "Unlimited Branches", "Unlimited Users"],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E293B" }}>
        Choose Your Plan
      </h2>
      <p
        style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "16px" }}>
        Select the subscription that fits your pharmacy.
      </p>

      {/* ... (Keep the Monthly/Yearly toggle buttons exactly as they are) ... */}
      <div style={{ display: "flex", gap: "12px" }}>
        {["monthly", "yearly"].map((cycle) => (
          <button
            key={cycle}
            type="button"
            onClick={() => updateField("billingCycle", cycle)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "16px",
              border:
                formData.billingCycle === cycle
                  ? "2px solid #0D9488"
                  : "2px solid #F1F5F9",
              background: formData.billingCycle === cycle ? "#F0FDFA" : "white",
              color: formData.billingCycle === cycle ? "#0D9488" : "#64748B",
              fontWeight: "700",
              cursor: "pointer",
              textTransform: "capitalize",
            }}>
            {cycle}{" "}
            {cycle === "yearly" && (
              <span
                style={{
                  fontSize: "0.7rem",
                  background: "#0D9488",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  marginLeft: "6px",
                }}>
                Save 17%
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {tiers.map((tier) => (
          <div
            key={tier.id}
            onClick={() => updateField("selectedTier", tier.id)}
            style={{
              padding: "20px",
              borderRadius: "20px",
              border:
                formData.selectedTier === tier.id
                  ? "2px solid #0D9488"
                  : "2px solid #F1F5F9",
              background:
                formData.selectedTier === tier.id ? "#F0FDFA" : "white",
              cursor: "pointer",
              transition: "all 0.3s",
              position: "relative",
            }}>
            {tier.popular && (
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "20px",
                  background: "#0D9488",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                }}>
                MOST POPULAR
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "800",
                  color: "#1E293B",
                }}>
                {tier.name}
              </h3>

              {/* 🚨 FIX: Dynamically switch the price based on the billing cycle */}
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: "#0D9488",
                }}>
                {formData.billingCycle === "yearly"
                  ? tier.yearlyPrice
                  : tier.monthlyPrice}
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748B",
                    fontWeight: "500",
                  }}>
                  ETB/{formData.billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {tier.features.map((feat) => (
                <div
                  key={feat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.85rem",
                    color: "#475569",
                  }}>
                  <Check size={16} color="#0D9488" /> {feat}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ... (Keep the Back/Next buttons exactly as they are) ... */}
      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            height: "52px",
            borderRadius: "20px",
            border: "2px solid #E2E8F0",
            background: "white",
            color: "#64748B",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}>
          <ArrowLeft size={20} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn btn-primary"
          style={{
            flex: 2,
            height: "52px",
            borderRadius: "20px",
            backgroundColor: "#0D9488",
            color: "white",
            border: "none",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}>
          Next <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const StepFive = ({ formData, updateField, onNext, onBack }) => {
  const handleDocChange = (type, file) => {
    updateField("documents", { ...formData.documents, [type]: file });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E293B" }}>
        Upload Documents
      </h2>
      <p
        style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "16px" }}>
        Help us verify your pharmacy (Optional for now).
      </p>

      <FileUploadBox
        label="Pharmacy License"
        file={formData.documents.pharmacyLicense}
        onFileChange={(file) => handleDocChange("pharmacyLicense", file)}
      />
      <FileUploadBox
        label="Owner's Pharmacist License"
        file={formData.documents.pharmacistLicense}
        onFileChange={(file) => handleDocChange("pharmacistLicense", file)}
      />

      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            height: "52px",
            borderRadius: "20px",
            border: "2px solid #E2E8F0",
            background: "white",
            color: "#64748B",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}>
          {" "}
          <ArrowLeft size={20} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn btn-primary"
          style={{
            flex: 2,
            height: "52px",
            borderRadius: "20px",
            backgroundColor: "#0D9488",
            color: "white",
            border: "none",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}>
          Next <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const StepSix = ({ formData, updateField, onSubmit, onBack, isLoading }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E293B" }}>
      Terms & Confirmation
    </h2>
    <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "16px" }}>
      Almost there! Please review our policies.
    </p>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "20px",
        background: "#F8FAFC",
        borderRadius: "20px",
      }}>
      <Checkbox
        label="I agree to the Terms of Service and Privacy Policy."
        checked={formData.acceptTerms}
        onChange={() => updateField("acceptTerms", !formData.acceptTerms)}
      />
      <Checkbox
        label="I agree to receive occasional product updates and newsletters."
        checked={formData.newsletter}
        onChange={() => updateField("newsletter", !formData.newsletter)}
      />
    </div>

    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        style={{
          flex: 1,
          height: "52px",
          borderRadius: "20px",
          border: "2px solid #E2E8F0",
          background: "white",
          color: "#64748B",
          fontWeight: "700",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
        <ArrowLeft size={20} /> Back
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        className="btn btn-primary"
        style={{
          flex: 2,
          height: "52px",
          borderRadius: "20px",
          backgroundColor: "#0D9488",
          color: "white",
          border: "none",
          fontWeight: "700",
          cursor: isLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          opacity: isLoading ? 0.7 : 1,
        }}>
        {isLoading ? "Finalizing..." : "Complete Registration"}{" "}
        <Sparkles size={20} />
      </button>
    </div>
  </div>
);

// ─── MAIN SIGNUP COMPONENT ────────────────────────────────────────────────────

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
    selectedTier: "starter_fikir",
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

  useEffect(() => {
    if (user && user.pharmacyId) {
      navigate("/");
    }
  }, [user, navigate]);

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
        pharmacyData: {
          pharmacyName: formData.pharmacyName,
          phone: `+251${formData.phone}`,
          email: formData.email,
          licenseNumber: formData.licenseNumber,
          taxId: formData.taxId,
          pharmacyType: formData.pharmacyType,
          address: formData.address,
          businessEmail: formData.businessEmail,
          businessPhone: formData.businessPhone
            ? `+251${formData.businessPhone}`
            : "",
          website: formData.website,
        },
        subscriptionData: {
          selectedTier: formData.selectedTier,
          billingCycle: formData.billingCycle,
        },
        documents: {
          pharmacyLicense: formData.documents.pharmacyLicense
            ? "mock_url_license"
            : null,
          pharmacistLicense: formData.documents.pharmacistLicense
            ? "mock_url_pharmacist"
            : null,
        },
      };

      await finalizeRegistration(payload);
      navigate("/verify-email");
    } catch (error) {
      setLocalError(error.message || "Registration failed");
    } finally {
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
            <StepOne
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
            <StepTwo
              formData={formData}
              updateField={updateField}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <StepThree
              formData={formData}
              updateField={updateField}
              updateAddress={updateAddress}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <StepFour
              formData={formData}
              updateField={updateField}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && (
            <StepFive
              formData={formData}
              updateField={updateField}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 6 && (
            <StepSix
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
              {" "}
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
