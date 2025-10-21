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
        Backup and push menus & menu items from <strong>staging</strong> to <strong>production</strong> store.
      </p>

      <button
        onClick={handleSyncMenus}
        disabled={fetcher.state === "submitting"}
        className={`px-4 py-2 rounded-lg text-white ${
          fetcher.state === "submitting"
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {fetcher.state === "submitting" ? "Syncing Menus..." : "Backup & Push Menus"}
      </button>

      {fetcher.data && (
        <div className="mt-4">
          <p
            className={`font-medium ${
              fetcher.data.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {fetcher.data.message}
          </p>

          {fetcher.data.results && (
            <ul className="mt-2 space-y-3">
              {fetcher.data.results.map((menu) => (
                <li key={menu.handle} className="p-2 border rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{menu.title}</span>
                    <span
                      className={`font-medium ${
                        menu.status.startsWith("✅")
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {menu.status}
                    </span>
                  </div>

                  {/* Show missing or added menu items */}
                  {menu.missingItems?.length > 0 && (
                    <div className="mt-1 text-sm text-red-600">
                      Missing / Added items: {menu.missingItems.join(", ")}
                    </div>
                  )}
                  {menu.extraItems?.length > 0 && (
                    <div className="mt-1 text-sm text-gray-600">
                      Extra items in production: {menu.extraItems.join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
