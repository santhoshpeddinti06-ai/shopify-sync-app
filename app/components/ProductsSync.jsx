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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">🛍️ Product Sync</h1>

      <button
        onClick={handleSync}
        disabled={fetcher.state === "submitting"}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {fetcher.state === "submitting" ? "Syncing..." : "Sync to Production"}
      </button>

      {message && <p className="mt-3 text-green-600">{message}</p>}

      <div className="mt-6">
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found in staging store.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 shadow-sm bg-white">
                <h2 className="font-semibold text-lg">{p.title}</h2>
                <p className="text-gray-600">
                  Price: {p.variants?.[0]?.price ?? "N/A"}{" "}
                  {p.variants?.[0]?.currencyCode ?? ""}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {p.status === "ACTIVE" ? "🟢 Active" : "⚪ Draft"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
