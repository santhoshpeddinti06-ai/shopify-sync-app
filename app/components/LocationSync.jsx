import { useFetcher, useOutletContext } from "@remix-run/react";
import { useState, useEffect } from "react";

export default function LocationSync() {
  const fetcher = useFetcher();

  // 🔹 Read global direction from Outlet context
  const outletContext = useOutletContext();
  const globalDirection = outletContext?.direction || "stage-to-prod";

  const [direction, setDirection] = useState(globalDirection);

  // Keep local direction in sync with global direction
  useEffect(() => {
    setDirection(globalDirection);
  }, [globalDirection]);

  const handleFetchLocations = () => {
    const formData = new FormData();
    formData.append("direction", direction);
    fetcher.submit(formData, { method: "post", action: "/api/sync/locations" });
  };

  return (
    <div style={{ padding: "20px", borderRadius: "12px", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "10px" }}>📍 Location Sync</h2>

      <p style={{ color: "#555", marginBottom: "15px" }}>
        🔁 Current Direction:{" "}
        <strong>
          {direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"}
        </strong>
      </p>

      <button
        onClick={handleFetchLocations}
        disabled={fetcher.state === "submitting"}
        style={{
          backgroundColor: fetcher.state === "submitting" ? "#ccc" : "#007bff",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "none",
          cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {fetcher.state === "submitting" ? "Fetching Locations..." : "Fetch & Compare Locations"}
      </button>

      {fetcher.data?.results && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Location Name</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Address</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Status</th>
          </tr>
          </thead>
          <tbody>
          {fetcher.data.results.map((loc, idx) => (
            <tr key={idx}>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{loc.name}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{loc.address}</td>
              <td
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px",
                  fontWeight: "500",
                  color: loc.status.includes("Missing") ? "orange" : "green",
                }}
              >
                {loc.status}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
