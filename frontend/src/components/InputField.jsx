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


export default InputField;
