// Helper to safely format the address (handles both strings and objects)
  export const formatAddress = (address) => {
    if (!address) return "No address provided";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const parts = [address.street, address.city, address.state, address.country].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "No address provided";
    }
    return "No address provided";
  };
