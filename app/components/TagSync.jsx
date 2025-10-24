// app/components/TagSync.jsx
import { useFetcher, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function TagSync() {
  const fetcher = useFetcher();
  const outlet = useOutletContext(); // expects { direction } from app.jsx Outlet context
  const globalDirection = outlet?.direction || "stage-to-prod";

  const [direction, setDirection] = useState(globalDirection);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  // Keep local direction in sync with global direction
  useEffect(() => {
    setDirection(globalDirection);
  }, [globalDirection]);

  // Load source products whenever direction changes
  useEffect(() => {
    fetcher.load(`/api/sync/tags?direction=${direction}`);
  }, [direction]);

  // When loader returns, show products
  useEffect(() => {
    if (fetcher.data?.products) {
      setProducts(fetcher.data.products);
    }
    if (fetcher.data?.message) {
      setMessage(fetcher.data.message);
    }
  }, [fetcher.data]);

  const handleSync = () => {
    const form = new FormData();
    form.append("action", "sync");
    form.append("direction", direction);
    fetcher.submit(form, { method: "post", action: "/api/sync/tags" });
  };

  // Update UI with action result
  useEffect(() => {
    if (fetcher.data?.results) {
      setMessage(fetcher.data.message || "");
    }
  }, [fetcher.data]);

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>🏷️ Tag Sync</h2>
      <p style={{ color: "#444", marginBottom: 12 }}>
        Current direction:
        <strong style={{ marginLeft: 8 }}>
          {direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"}
        </strong>
      </p>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handleSync}
          disabled={fetcher.state === "submitting"}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor: fetcher.state === "submitting" ? "#9ca3af" : "#2563eb",
            color: "#fff",
            cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
          }}
        >
          {fetcher.state === "submitting" ? "Syncing tags..." : "Backup & Push Tags"}
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: "#f0f9ff" }}>
          <strong>{message}</strong>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Source products (preview)</h3>
        {products.length === 0 ? (
          <p style={{ color: "#666" }}>No products found (source store may be empty or loader failed).</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>Product</div>
            <div style={{ fontWeight: 700 }}>Tags</div>
            {products.map((p) => (
              <div key={p.handle || p.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
                {p.title} <small style={{ color: "#666", marginLeft: 6 }}>({p.handle})</small>
              </div>
            ))}
            {products.map((p) => (
              <div key={(p.handle || p.id) + "-tags"} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
                {(p.tags || []).join(", ") || <span style={{ color: "#999" }}>—</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
