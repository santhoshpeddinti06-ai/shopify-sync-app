import { useFetcher } from "@remix-run/react";

export default function MenuSync() {
  const fetcher = useFetcher();

  const handleSyncMenus = () => {
    fetcher.submit({}, { method: "post", action: "/api/sync/menus" });
  };

  return (
    <div className="p-4 border rounded-xl shadow-md bg-white w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-2">Menu Sync</h2>
      <p className="text-gray-600 mb-4">
        Backup and push menus from staging to production store.
      </p>

      <button
        onClick={handleSyncMenus}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        {fetcher.state === "submitting" ? "Syncing..." : "Backup & Push Menus"}
      </button>

      {fetcher.data && (
        <div className="mt-3">
          <p className={fetcher.data.success ? "text-green-600" : "text-red-600"}>
            {fetcher.data.message}
          </p>
        </div>
      )}
    </div>
  );
}
