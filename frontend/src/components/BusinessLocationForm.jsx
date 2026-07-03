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


const BusinessLocationForm = ({
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

export default BusinessLocationForm
