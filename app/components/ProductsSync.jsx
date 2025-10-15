// app/components/ProductsSync.jsx
import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function ProductSync() {
  const fetcher = useFetcher();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/sync/products");
        const data = await res.json();
        if (data.products) setProducts(data.products);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSync = () => {
    setMessage("");
    fetcher.submit(
      { action: "sync" },
      { method: "post", action: "/api/sync/products" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      setMessage(`${fetcher.data.syncedCount} products synced successfully!`);
    } else if (fetcher.data?.error) {
      setMessage(`Error: ${fetcher.data.error}`);
    }
  }, [fetcher.data]);

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <h1 style={{
        fontSize: "24px",
        fontWeight: "600",
        marginBottom: "16px",
      }}
      >🛍️ Product Sync</h1>

      <button
        onClick={handleSync}
        disabled={fetcher.state === "submitting"}
        style={{
          backgroundColor: "#2563eb", // blue-600
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
        {fetcher.state === "submitting" ? "Syncing..." : "Sync to Production"}
      </button>

      {/* ✅ Sync Log Panel */}
      {message && (
        <div
          style={{
            marginTop: "1.5rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "0.5rem",
            padding: "1rem",
            maxWidth: "400px",
            fontSize: "14px",
          }}
        >
          <p style={{ color: "#15803d", fontWeight: "600" }}>{message}</p>
          <hr style={{ margin: "0.5rem 0" }} />
          <p><strong>🕒 Synced At:</strong> {new Date().toLocaleString()}</p>
          <p><strong>📦 Total Products:</strong> {products.length}</p>
          <p><strong>✅ Status:</strong> Success</p>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found in staging store.</p>
        ) : (
          <div style={{ display:"flex", flexWrap:"wrap",
            justifyContent:"flex-start",gap:"16px",padding:"4rem"}}>
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white border rounded-md shadow-sm hover:shadow-md transition p-2 flex flex-col items-center text-center"
                style={{ width: "140px", boxShadow:"0 0 10px 8px rgba(0,0,0,0.1)"}} // Card width
              >
                {/* Product Image */}
                {p.images?.[0]?.src ? (
                  <img
                    src={p.images[0].src}
                    alt={p.title}
                    className="object-contain rounded-md mb-2"
                    style={{ width: "140px", height: "120px"}} // Image size
                  />
                ) : (
                  <div
                    className="bg-gray-100 flex items-center justify-center rounded-md mb-2 text-xs text-gray-500"
                    style={{ width: "140px", height: "100px"}}
                  >
                    No Image
                  </div>
                )}

                {/* Product Title */}
                <h2 style={{fontWeight:"500",marginLeft:"10px"}}>
                  {p.title}
                </h2>

                {/* Price */}
                <p  style={{marginLeft:"10px"}}>
                  {p.variants?.[0]?.price
                    ? `$${p.variants[0].price} ${p.variants[0].currencyCode ?? ""}`
                    : "Price N/A"}
                </p>

                {/* Status Badge */}
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px", // px-2 py-1
                    borderRadius: "2rem", // fully rounded
                    fontSize: "12px", // text-xs
                    fontWeight: 600, // font-semibold
                    marginLeft:"8px",
                    marginBottom:"8px",
                    backgroundColor: p.status === "active"
                      ? "#d1fae5" // green light
                      : p.status === "archived"
                        ? "#fef3c7" // yellow light
                        : "#e5e7eb", // gray for draft
                    color:
                      p.status === "active"
                        ? "#065f46" // dark green
                        : p.status === "archived"
                          ? "#92400e" // dark yellow/brown
                          : "#374151", // dark gray
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
