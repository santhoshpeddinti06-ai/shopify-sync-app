import { useFetcher, useOutletContext } from "@remix-run/react";
import { useState, useEffect } from "react";

export default function TagSync() {
  const fetcher = useFetcher();
  const outletContext = useOutletContext(); // Read global direction
  const globalDirection = outletContext?.direction || "stage-to-prod";

  const [direction, setDirection] = useState(globalDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sync local direction with global direction
  useEffect(() => {
    setDirection(globalDirection);
  }, [globalDirection]);

  // Fetch tags whenever direction changes
  useEffect(() => {
    fetcher.load(`/api/sync/tags?direction=${direction}`);
  }, [direction]);

  const data = fetcher.data;
  const results = data?.results || [];

  // Pagination logic
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handlePush = () => {
    fetcher.submit(
      { action: "push", direction },
      { method: "post", action: "/api/sync/tags" }
    );
  };

  return (
    <div style={{ padding: "16px", maxWidth: "900px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
        🏷️ Product Tags Sync
      </h2>

      <p>
        Current direction:
        <strong style={{ marginLeft: 8 }}>
          {direction === "stage-to-prod"
            ? "Staging → Production"
            : "Production → Staging"}
        </strong>
      </p>

      <fetcher.Form method="post" action="/api/sync/tags">
        <button
          type="button"
          onClick={handlePush}
          disabled={fetcher.state === "submitting"}
          style={{
            backgroundColor: "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
            marginBottom: "16px",
          }}
        >
          {fetcher.state === "submitting" ? "Syncing..." : "Backup & Push Tags"}
        </button>
      </fetcher.Form>

      {data && (
        <>
          <p style={{ fontWeight: 500 }}>
            Results: Matched {data.matched || 0} | Updated {data.updatedCount || 0} | Failed {data.failed || 0}
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Product</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Handle</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Status</th>
            </tr>
            </thead>
            <tbody>
            {paginatedResults.map((item) => (
              <tr key={item.handle}>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.title}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.handle}</td>
                <td
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                    color: item.status.includes("✅") ? "green" : "orange",
                    fontWeight: 500,
                  }}
                >
                  {item.status}
                </td>
              </tr>
            ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
