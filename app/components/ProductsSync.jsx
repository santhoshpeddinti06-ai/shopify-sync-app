import { useFetcher, useOutletContext } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function ProductSync() {
  const fetcher = useFetcher();
  const { direction } = useOutletContext(); // 🔹 get global sync direction from App.jsx
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentDirection, setCurrentDirection] = useState(direction);

  // 🔹 Re-fetch products whenever the global sync direction changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sync/products?direction=${direction}`);
        const data = await res.json();
        if (data.products) setProducts(data.products);
        setCurrentDirection(direction); // 🔹 update current direction dynamically
      } catch (err) {
        console.error(err);
        setMessage("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [direction]);

  const handleSync = () => {
    setMessage("");
    fetcher.submit(
      { action: "sync", direction },
      { method: "post", action: "/api/sync/products" }
    );
  };

  // 🔹 update message after syncing
  useEffect(() => {
    if (fetcher.data?.success) {
      setMessage(
        `${fetcher.data.syncedCount} product${
          fetcher.data.syncedCount > 1 ? "s" : ""
        } synced successfully (${fetcher.data.direction === "stage-to-prod"
          ? "staging → production"
          : "production → staging"})`
      );
      setProducts(fetcher.data.results || products);
    } else if (fetcher.data?.error) {
      setMessage(`Error: ${fetcher.data.error}`);
    }
  }, [fetcher.data]);

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>
        🛍️ Product Sync
      </h1>

      <p>
        Current Direction:{" "}
        <strong>
          {currentDirection === "stage-to-prod"
            ? "Staging → Production"
            : "Production → Staging"}
        </strong>
      </p>

      <button
        onClick={handleSync}
        disabled={fetcher.state === "submitting"}
        style={{
          backgroundColor: "#2563eb",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: "6px",
          cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
          opacity: fetcher.state === "submitting" ? 0.5 : 1,
          transition: "0.3s",
          border: "none",
          marginBottom: "12px",
        }}
      >
        {fetcher.state === "submitting" ? "Syncing..." : "Backup & Push Products"}
      </button>

      {message && (
        <div
          style={{
            marginTop: "1.5rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "0.5rem",
            padding: "1rem",
            maxWidth: "500px",
            fontSize: "14px",
          }}
        >
          <p style={{ color: "#15803d", fontWeight: "600" }}>{message}</p>
          <hr style={{ margin: "0.5rem 0" }} />
          <p>
            <strong>🕒 Synced At:</strong> {new Date().toLocaleString()}
          </p>
          <p>
            <strong>📦 Total Products:</strong> {products.length}
          </p>
          <p>
            <strong>✅ Status:</strong>{" "}
            {fetcher.state === "submitting" ? "Syncing..." : "Success"}
          </p>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found in the source store.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              gap: "16px",
              padding: "1rem",
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white border rounded-md shadow-sm hover:shadow-md transition p-2 flex flex-col items-center text-center"
                style={{ width: "140px", boxShadow: "0 0 10px 8px rgba(0,0,0,0.1)" }}
              >
                {p.images?.[0]?.src ? (
                  <img
                    src={p.images[0].src}
                    alt={p.title}
                    className="object-contain rounded-md mb-2"
                    style={{ width: "140px", height: "120px" }}
                  />
                ) : (
                  <div
                    className="bg-gray-100 flex items-center justify-center rounded-md mb-2 text-xs text-gray-500"
                    style={{ width: "140px", height: "100px" }}
                  >
                    No Image
                  </div>
                )}
                <h2 style={{ fontWeight: "500", marginLeft: "10px" }}>{p.title}</h2>
                <p style={{ marginLeft: "10px" }}>
                  {p.variants?.[0]?.price
                    ? `$${p.variants[0].price} ${p.variants[0].currencyCode ?? ""}`
                    : "Price N/A"}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "2rem",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginLeft: "8px",
                    marginBottom: "8px",
                    backgroundColor:
                      p.status === "active"
                        ? "#d1fae5"
                        : p.status === "archived"
                          ? "#fef3c7"
                          : "#e5e7eb",
                    color:
                      p.status === "active"
                        ? "#065f46"
                        : p.status === "archived"
                          ? "#92400e"
                          : "#374151",
                  }}
                >
                  {p.status === "active"
                    ? "Active"
                    : p.status === "archived"
                      ? "Archived"
                      : "Draft"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
