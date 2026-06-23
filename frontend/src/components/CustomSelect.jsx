import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const CustomSelect = ({ options, value, onChange, placeholder = "Select...", className = "", style = {}, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%", ...style }} className={className}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "14px 20px",
          background: disabled ? "#F1F5F9" : "#F8FAFC",
          borderRadius: "16px",
          cursor: disabled ? "not-allowed" : "pointer",
          border: isOpen ? "2px solid #0D9488" : "2px solid transparent",
          transition: "all 0.2s ease",
          color: selectedOption ? "#1E293B" : "#94A3B8",
          fontSize: "0.95rem",
          fontWeight: selectedOption ? "500" : "400",
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={18} 
          style={{ 
            color: "#94A3B8", 
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease"
          }} 
        />
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            border: "1px solid #F1F5F9",
            zIndex: 50,
            overflow: "hidden",
            maxHeight: "250px",
            overflowY: "auto",
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: "14px 20px", color: "#94A3B8", textAlign: "center", fontSize: "0.9rem" }}>
              No options available
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F0FDFA";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  color: value === option.value ? "#0D9488" : "#334155",
                  fontWeight: value === option.value ? "600" : "400",
                  fontSize: "0.95rem",
                }}
              >
                {option.label}
                {value === option.value && <Check size={16} color="#0D9488" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
