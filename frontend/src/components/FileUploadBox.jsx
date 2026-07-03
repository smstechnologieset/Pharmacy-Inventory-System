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

export default FileUploadBox
