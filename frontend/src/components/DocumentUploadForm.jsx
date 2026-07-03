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
import FileUploadBox from "./FileUploadBox.jsx";

const DocumentUploadForm = ({ formData, updateField, onNext, onBack }) => {
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

export default DocumentUploadForm;
