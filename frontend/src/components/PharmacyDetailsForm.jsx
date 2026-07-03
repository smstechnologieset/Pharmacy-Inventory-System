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
import InputField from "./InputField.jsx";
const PharmacyDetailsForm = ({ formData, updateField, onNext, onBack }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E293B" }}>
      Pharmacy Details{" "}
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
        Next <ArrowRight size={20} />
      </button>
    </div>
  </div>
);

export default PharmacyDetailsForm;
