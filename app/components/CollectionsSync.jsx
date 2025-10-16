// app/components/CollectionsSync.jsx
import { useFetcher } from "@remix-run/react";

export default function CollectionsSync() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const result = fetcher.data;

  return (
    <div style={{ padding: "16px", maxWidth: "700px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
        📂 Collections Sync
      </h2>

      <fetcher.Form method="post" action="/api/sync/collections">
        <input type="hidden" name="action" value="sync" />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Syncing..." : "Sync Collections"}
        </button>
      </fetcher.Form>

      {/* Result box */}
      {result && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: result.success ? "#ecfdf5" : "#fff1f2",
            border: `1px solid ${result.success ? "#a7f3d0" : "#fecaca"}`,
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            {result.message || (result.success ? "Sync complete" : "Sync failed")}
          </p>

          {/* Detailed lists */}
          {Array.isArray(result.syncedManual) && result.syncedManual.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <strong>Manual collections added:</strong>
              <ul style={{ margin: "6px 0 0 18px" }}>
                {result.syncedManual.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(result.syncedSmart) && result.syncedSmart.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <strong>Smart collections added:</strong>
              <ul style={{ margin: "6px 0 0 18px" }}>
                {result.syncedSmart.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
