import { useFetcher } from "@remix-run/react";

export default function DiscountSync() {
  const fetcher = useFetcher();

  const handleSyncDiscounts = () => {
    fetcher.submit({}, { method: "post", action: "/api/sync/discounts" });
  };

  return (
    <div
      style={{
        padding: "16px",
        maxWidth: "800px",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>
        🏷️ Discount Sync
      </h2>
      <p style={{ color: "#4b5563", marginBottom: "16px" }}>
        Backup and compare discounts from <strong>staging</strong> to <strong>production</strong> store.
      </p>

      <button
        onClick={handleSyncDiscounts}
        disabled={fetcher.state === "submitting"}
        style={{
          backgroundColor: fetcher.state === "submitting" ? "#9ca3af" : "#2563eb",
          color: "#ffffff",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {fetcher.state === "submitting" ? "Fetching Discounts..." : "Backup & Compare Discounts"}
      </button>

      {fetcher.data && (
        <div style={{ marginTop: "16px" }}>
          <p
            style={{
              fontWeight: 500,
              color: fetcher.data.success ? "#16a34a" : "#dc2626",
              marginBottom: "12px",
            }}
          >
            {fetcher.data.message}
          </p>

          {fetcher.data.results && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, gap: "8px" }}>
              {fetcher.data.results.map((discount, index) => (
                <li
                  key={`${discount.title}-${discount.code}-${index}`}
                  style={{
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{discount.title}</span>
                    {discount.code && (
                      <span style={{ marginLeft: "8px", color: "#6b7280" }}>
                        ({discount.code})
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontWeight: 500,
                      color: discount.status.startsWith("✅") ? "#16a34a" : "#f97316",
                    }}
                  >
                    {discount.status}
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
