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

export default Checkbox;
