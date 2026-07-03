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
import InputField from "../components/InputField.jsx";
import Checkbox from "../components/Checkbox.jsx";
const TermsAndConfirmationForm = ({
  formData,
  updateField,
  onSubmit,
  onBack,
  isLoading,
}) => (
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
        {isLoading ? "Finalizing..." : "Complete Registration"}
        <Sparkles size={20} />
      </button>
    </div>
  </div>
);

export default TermsAndConfirmationForm;
