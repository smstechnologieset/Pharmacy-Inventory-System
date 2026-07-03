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
const AccountCreationForm = ({
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
      />
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

export default AccountCreationForm;
