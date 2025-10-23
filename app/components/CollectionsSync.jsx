// app/components/CollectionsSync.jsx
import { useFetcher, useOutletContext } from "@remix-run/react";
import { useState, useEffect } from "react";

export default function CollectionsSync() {
  const fetcher = useFetcher();

  // 🔹 READ global direction from Outlet context (provided by app.jsx)
  //    This replaces passing a prop manually and ensures the component updates
  //    whenever the global direction changes in the parent.
  const outletContext = useOutletContext(); // <-- NEW
  const globalDirection = outletContext?.direction || "stage-to-prod"; // <-- NEW

  const [direction, setDirection] = useState(globalDirection);

  // Keep local direction in sync with the global direction from outlet context
  useEffect(() => {
    setDirection(globalDirection); // <-- UPDATED: sync with Outlet context
  }, [globalDirection]);

  // When user clicks sync: send form data including current direction
  const handleSync = () => {
    const formData = new FormData();
    formData.append("action", "sync");
    formData.append("direction", direction);
    fetcher.submit(formData, { method: "post", action: "/api/sync/collections" });
  };

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
        📂 Collections Sync
      </h2>

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
          {fetcher.state === "submitting" ? "Syncing..." : "Backup & Push Collections"}
        </button>
      </div>

      {/* Show results */}
      {fetcher.data?.message && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #86efac",
            backgroundColor: "#f0fdf4",
          }}
        >
          <div style={{ fontWeight: 600 }}>{fetcher.data.message}</div>

          {fetcher.data.syncedCollections?.length > 0 && (
            <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
              {fetcher.data.syncedCollections.map((title) => (
                <li key={title} style={{ marginBottom: "6px" }}>
                  {title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
