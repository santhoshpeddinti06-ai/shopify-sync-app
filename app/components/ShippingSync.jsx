// app/components/ShippingSync.jsx
import { useFetcher, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function ShippingSync() {
  const fetcher = useFetcher();
  const outletContext = useOutletContext(); // read global sync direction from parent
  const globalDirection = outletContext?.direction || "stage-to-prod";

  const [direction, setDirection] = useState(globalDirection);

  // Sync local direction with global
  useEffect(() => {
    setDirection(globalDirection);
    fetcher.load(`/api/sync/shipping?direction=${globalDirection}`);
  }, [globalDirection]);

  const handleSync = () => {
    const formData = new FormData();
    formData.append("action", "sync");
    formData.append("direction", direction);
    fetcher.submit(formData, { method: "post", action: "/api/sync/shipping" });
  };

  return (
    <div style={{ padding: "16px", borderRadius: "12px", maxWidth: "850px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>📦 Shipping Methods Sync</h2>

      <p style={{ color: "#4a5568", marginBottom: "12px" }}>
        🔁 Current Direction:{" "}
        <strong>
          {direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"}
        </strong>
      </p>

      <button
        onClick={handleSync}
        disabled={fetcher.state === "submitting"}
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          color: "#fff",
          backgroundColor: fetcher.state === "submitting" ? "#a0aec0" : "#3182ce",
          cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
          border: "none",
          marginBottom: "20px",
        }}
      >
        {fetcher.state === "submitting" ? "Syncing..." : "Backup & Sync Shipping Methods"}
      </button>

      {fetcher.data && (
        <div>
          <p style={{ fontWeight: "500", color: fetcher.data.success ? "#38a169" : "#e53e3e" }}>
            {fetcher.data.message}
          </p>

          {fetcher.data.results && (
            <ul style={{ marginTop: "12px", listStyle: "none", padding: 0 }}>
              {fetcher.data.results.map((zone) => (
                <li
                  key={zone.name}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "600" }}>{zone.name}</span>
                    <span style={{ color: "#718096", marginLeft: "8px" }}>({zone.countries})</span>
                  </div>
                  <span
                    style={{
                      color: zone.status.startsWith("✅") ? "#38a169" : "#dd6b20",
                      fontWeight: "500",
                    }}
                  >
                    {zone.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
