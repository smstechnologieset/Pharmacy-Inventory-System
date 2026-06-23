import React from "react";

const Avatar = ({ src, name, pharmacyName, size = 36, style = {} }) => {
  const letter = (pharmacyName || name || "?")[0].toUpperCase();

  const colors = [
    { bg: "#CCFBF1", color: "#0D9488" },
    { bg: "#DBEAFE", color: "#2563EB" },
    { bg: "#EDE9FE", color: "#7C3AED" },
    { bg: "#FEF3C7", color: "#D97706" },
    { bg: "#FCE7F3", color: "#DB2777" },
  ];

  // Pick a consistent color based on the letter
  const colorPair = colors[letter.charCodeAt(0) % colors.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name || pharmacyName}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colorPair.bg,
        color: colorPair.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: size * 0.4,
        flexShrink: 0,
        ...style,
      }}>
      {letter}
    </div>
  );
};

export default Avatar;
