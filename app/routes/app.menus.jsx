import { useFetcher } from "@remix-run/react";

export default function MenuSync() {
  const fetcher = useFetcher();

  const handleSyncMenus = () => {
    fetcher.submit({}, { method: "post", action: "/api/sync/menus" });
  };

  return (
    <div style={{
      padding: "16px",
      width: "100%",
      maxWidth: "600px",
    }}>
      <h2 style={{
        fontSize: "20px",
        fontWeight: "600",
        marginBottom: "8px",
      }}>  📋 Menu Sync
      </h2>
      <p style={{
        color: "#4b5563",
        marginBottom: "16px",
      }}>
        Backup and push menus from staging to production store.
      </p>

      <button
        onClick={handleSyncMenus}
        style={{
          backgroundColor: fetcher.state === "submitting" ? "#3b82f6cc" : "#2563eb",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "none",
          cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
          transition: "background-color 0.2s ease",
        }}
      >
        {fetcher.state === "submitting" ? "Syncing..." : "Backup & Push Menus"}
      </button>

      {fetcher.data && (
        <div style={{marginTop:"12px"}}>
          <p  style={{
            color: fetcher.data.success ? "#16a34a" : "#dc2626",
            fontWeight: "500",
          }}>
            {fetcher.data.message}
          </p>
        </div>
      )}
    </div>
  );
}
