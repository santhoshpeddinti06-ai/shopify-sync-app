// app/components/MenusSync.jsx
import { useEffect, useState } from "react";
import { useFetcher, useOutletContext } from "@remix-run/react";

export default function MenusSync() {
  const fetcher = useFetcher();

  // 🔹 Read global direction from Outlet context (provided by parent layout)
  const outletContext = useOutletContext();
  const globalDirection = outletContext?.direction || "stage-to-prod";

  const [direction, setDirection] = useState(globalDirection);

  // Keep local direction in sync with global direction
  useEffect(() => {
    setDirection(globalDirection);
  }, [globalDirection]);

  // Auto fetch menus whenever direction changes
  useEffect(() => {
    fetcher.load(`/api/sync/menus?direction=${direction}`);
  }, [direction]);

  // Handle sync button click
  const handleSync = () => {
    const formData = new FormData();
    formData.append("action", "sync");
    formData.append("direction", direction);
    fetcher.submit(formData, { method: "post", action: "/api/sync/menus" });
  };

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
        📋 Menus Sync
      </h2>

      {/* Current Direction */}
      <p style={{ color: "#555", marginBottom: "12px" }}>
        🔁 Current Direction:{" "}
        <strong>
          {direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"}
        </strong>
      </p>

      <div style={{ marginBottom: "12px" }}>
        <button
          type="button"
          onClick={handleSync}
          disabled={fetcher.state === "submitting"}
          style={{
            backgroundColor: fetcher.state === "submitting" ? "#9ca3af" : "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {fetcher.state === "submitting" ? "Syncing..." : "Sync Menus"}
        </button>
      </div>

      {/* Show synced menus */}
      {fetcher.data?.message && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            border: "1px solid #86efac",
            backgroundColor: "#f0fdf4",
            borderRadius: "6px",
          }}
        >
          {fetcher.data.message}
          {fetcher.data.results?.length > 0 && (
            <ul style={{ marginTop: "8px" }}>
              {fetcher.data.results.map((r) => (
                <li key={r.handle}>
                  {r.title} — {r.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
