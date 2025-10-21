import { useFetcher } from "@remix-run/react";
import { useState } from "react";

export default function MenuSync() {
  const fetcher = useFetcher();
  const [logs, setLogs] = useState([]);

  const handleSyncMenus = async () => {
    setLogs([]);
    fetcher.submit({}, { method: "post", action: "/api/sync/menus" });
  };

  // Show new results when fetcher completes
  if (fetcher.data && fetcher.data.results && fetcher.data !== logs) {
    setLogs(fetcher.data.results);
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-xl border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">🔄 Backup and Push Menus</h2>

      <button
        onClick={handleSyncMenus}
        disabled={fetcher.state === "submitting"}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {fetcher.state === "submitting" ? "Syncing..." : "Backup & Push Menus"}
      </button>

      {fetcher.data && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="font-medium">{fetcher.data.message}</p>

          {logs.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              {logs.map((log, index) => (
                <li key={index}>
                  <strong>{log.title}</strong> — {log.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
