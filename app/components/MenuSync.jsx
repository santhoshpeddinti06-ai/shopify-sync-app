// app/components/MenuSync.jsx
import { useFetcher } from "@remix-run/react";

export default function MenuSync() {
  const fetcher = useFetcher();

  const handleBackup = () => {
    fetcher.submit({ action: "backup" }, { method: "post", action: "/api/sync/menus" });
  };

  const handlePush = () => {
    fetcher.submit({ action: "push" }, { method: "post", action: "/api/sync/menus" });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600,marginBottom:15 }}>🧭 Menu Sync</h2>
      <button
        onClick={handleBackup}
        disabled={fetcher.state === "submitting"}
        style={{
          backgroundColor: "#f59e0b",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 6,
          marginRight: 40,
        }}
      >
        {fetcher.state === "submitting" ? "Backing up..." : "Backup Menus"}
      </button>

      <button
        onClick={handlePush}
        disabled={fetcher.state === "submitting"}
        style={{
          backgroundColor: "#2563eb",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 6,
        }}
      >
        {fetcher.state === "submitting" ? "Pushing..." : "Push to Production"}
      </button>

      {fetcher.data?.message && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            borderRadius: 6,
            backgroundColor: fetcher.data.success ? "#dcfce7" : "#fee2e2",
            color: fetcher.data.success ? "#166534" : "#991b1b",
          }}
        >
          {fetcher.data.message}
        </div>
      )}
    </div>
  );
}
