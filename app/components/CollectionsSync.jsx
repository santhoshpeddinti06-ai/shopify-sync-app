// app/components/CollectionsSync.jsx
import { useFetcher } from "@remix-run/react";

export default function CollectionsSync() {
  const fetcher = useFetcher();

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
        📂 Collections Sync
      </h2>

      <fetcher.Form method="post" action="/api/sync/collections">
        <input type="hidden" name="action" value="sync" />
        <button
          type="submit"
          disabled={fetcher.state === "submitting"}
          style={{
            backgroundColor: "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
          }}
        >
          {fetcher.state === "submitting" ? "Syncing..." : "Sync Collections"}
        </button>
      </fetcher.Form>

      {/* ✅ Show synced collections status */}
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
          {fetcher.data.syncedCollections?.length > 0 && (
            <ul style={{ marginTop: "8px" }}>
              {fetcher.data.syncedCollections.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
