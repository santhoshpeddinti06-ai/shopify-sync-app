import { useFetcher } from "@remix-run/react";
import { useState } from "react";

export default function DiscountSync() {
  const fetcher = useFetcher();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setMessage("");
    setResults([]);

    const response = await fetch("/api/sync/discounts", {
      method: "POST",
    });

    const data = await response.json();
    setLoading(false);
    setMessage(data.message || "");
    setResults(data.results || []);
  };

  const containerStyle = {
    padding: "32px",
    maxWidth: "800px",
  };

  const titleStyle = {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const descStyle = {
    color: "#4b5563",
    marginBottom: "24px",
    fontSize: "13px",
    lineHeight: "1.5",
  };

  const buttonStyle = {
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: loading ? "#9ca3af" : "#2563eb",
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "background-color 0.3s",
  };

  const messageStyle = {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid",
    backgroundColor: message.includes("✅") ? "#ecfdf5" : "#fef2f2",
    color: message.includes("✅") ? "#065f46" : "#991b1b",
  };

  const resultContainerStyle = {
    marginTop: "32px",
  };

  const resultTitleStyle = {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "8px",
    color: "#374151",
  };

  const resultCardStyle = (status) => ({
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid",
    backgroundColor: status.includes("✅")
      ? "#ecfdf5"
      : status.includes("⚠️")
        ? "#fefce8"
        : "#fef2f2",
    borderColor: status.includes("✅")
      ? "#d1fae5"
      : status.includes("⚠️")
        ? "#fde68a"
        : "#fecaca",
    color: status.includes("✅")
      ? "#065f46"
      : status.includes("⚠️")
        ? "#78350f"
        : "#991b1b",
    marginBottom: "12px",
  });

  const cardTitleStyle = {
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "4px",
    display: "flex",
    justifyContent: "space-between",
  };

  const cardValueStyle = {
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "4px",
  };

  const cardStatusStyle = {
    fontSize: "12px",
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>🏷️ Discount Sync</h2>
      <p style={descStyle}>
        Fetch, compare, and sync discounts from your staging store to your
        production store.
      </p>

      <button style={buttonStyle} onClick={handleSync} disabled={loading}>
        {loading ? "Syncing Discounts..." : "Backup & Push Discounts"}
      </button>

      {message && <div style={messageStyle}>{message}</div>}

      {results.length > 0 && (
        <div style={resultContainerStyle}>
          <h3 style={resultTitleStyle}>Discount Comparison Results</h3>
          {results.map((r, index) => (
            <div key={index} style={resultCardStyle(r.status)}>
              <div style={cardTitleStyle}>
                <span>{r.title}</span>
                <span>{r.code}</span>
              </div>
              <div style={cardValueStyle}>Value: {r.value}</div>
              <div style={cardStatusStyle}>{r.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
