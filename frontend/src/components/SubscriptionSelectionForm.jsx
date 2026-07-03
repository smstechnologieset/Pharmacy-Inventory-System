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
const SubscriptionSelectionForm = ({
  formData,
  updateField,
  onNext,
  onBack,
}) => {
  const tiers = [
    {
      id: "starter", // Changed from "starter_fikir"
      name: "Starter",
      monthlyPrice: "1,500",
      yearlyPrice: "15,000",
      features: ["Up to 500 SKUs", "1 Branch", "3 Users"],
    },
    {
      id: "growth", // Changed from "growth_gizmo"
      name: "Growth",
      monthlyPrice: "3,000",
      yearlyPrice: "28,000",
      features: ["Up to 2,000 SKUs", "2 Branches", "5 Users"],
      popular: true,
    },
    {
      id: "business", // Changed from "business_medipro"
      name: "Business",
      monthlyPrice: "5,000",
      yearlyPrice: "42,000",
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
            {cycle}
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
export default SubscriptionSelectionForm;
