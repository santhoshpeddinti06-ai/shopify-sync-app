// app/components/ProductSync.jsx
import { useEffect, useState } from "react";

export default function ProductSync() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load products from staging
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/sync/products");
        const data = await res.json();
        if (res.ok && data.success) {
          setProducts(data.products);
          setMessage(`✅ Loaded ${data.products.length} products from staging`);
        } else {
          setMessage(`❌ ${data.error || "Failed to load products"}`);
        }
      } catch (err) {
        setMessage("❌ Network error while loading products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleSync = async () => {
    if (!window.confirm("Sync these products to production?")) return;
    setLoading(true);
    setMessage("Syncing products to production...");

    try {
      const res = await fetch("/api/sync/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`✅ ${data.syncedCount} products synced successfully`);
      } else {
        setMessage(`❌ Sync failed: ${data.error || data.message}`);
      }
    } catch (err) {
      console.error("Sync error:", err);
      setMessage("❌ Network or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🛍️ Product Sync</h2>

      <button onClick={handleSync} disabled={loading}>
        {loading ? "Syncing..." : "Sync to Production"}
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      <div style={{ marginTop: 20 }}>
        {products.length > 0 ? (
          <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Price</th>
              <th>Updated At</th>
            </tr>
            </thead>
            <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.status}</td>
                <td>{p.variants?.edges?.[0]?.node?.price || "—"}</td>
                <td>{new Date(p.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            </tbody>
          </table>
        ) : (
          <p>No products found</p>
        )}
      </div>
    </div>
  );
}
