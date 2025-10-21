import { useState } from "react";

export default function MenuSync() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePreview = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/sync/menus", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, message: err.message });
    }

    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-xl shadow-md bg-white w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-2">Menu Sync (Preview Mode)</h2>
      <p className="text-gray-600 mb-4">
        Compare staging vs production menus. No changes are applied automatically.
      </p>

      <button
        onClick={handlePreview}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Comparing..." : "Compare Menus"}
      </button>

      {result && (
        <div className="mt-4 p-3 border rounded-md bg-gray-50">
          <p className={result.success ? "text-green-700" : "text-red-700"}>
            {result.message}
          </p>

          {result.results && (
            <ul className="mt-2 space-y-2">
              {result.results.map((r) => (
                <li key={r.handle} className="border-b pb-1">
                  <strong>{r.title}</strong> — {r.status}
                  {r.missingItems?.length > 0 && (
                    <p className="text-sm text-yellow-700">
                      Missing: {r.missingItems.join(", ")}
                    </p>
                  )}
                  {r.extraItems?.length > 0 && (
                    <p className="text-sm text-blue-700">
                      Extra: {r.extraItems.join(", ")}
                    </p>
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
