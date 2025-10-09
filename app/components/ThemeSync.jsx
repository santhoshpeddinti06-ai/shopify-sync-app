import { useState, useEffect } from "react";

export default function ThemeSync() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch themes dynamically
  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/sync/themes");
        const data = await res.json();
        setThemes(data.themes || []);
      } catch (err) {
        console.error("Failed to fetch themes:", err);
        setMessage("Failed to load themes");
      }
    }
    fetchThemes();
  }, []);

  // Backup handler
  const handleBackup = async () => {
    if (!selectedTheme) {
      setMessage("Please select a theme first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sync/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: selectedTheme, action: "backup" }),
      });
      const data = await res.json();
      if (data.value) {
        setBackupData(JSON.parse(data.value)); // ✅ Save as parsed object
      }
      setMessage(data.message || "Backup completed!");
    } catch (err) {
      console.error(err);
      setMessage("Backup failed");
    } finally {
      setLoading(false);
    }
  };

  // Push handler with confirmation
  const handlePush = async () => {
    if (!selectedTheme) {
      setMessage("Please select a theme first");
      return;
    }

    if (!backupData) {
      setMessage("Please create a backup first before pushing.");
      return;
    }

    if (!window.confirm("Are you sure you want to overwrite the production theme settings?")) {
      return;
    }

    setLoading(true);

    // Log payload for debugging
    console.log("PUSH PAYLOAD:", {
      theme_id: import.meta.env.VITE_PRODUCT_THEME_ID,
      settings: backupData,
    });

    try {
      const res = await fetch("/api/sync/push-theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_id: import.meta.env.VITE_PRODUCT_THEME_ID, // always prod theme
          settings: backupData, // already parsed JS object
        }),
      });
      const data = await res.json();
      setMessage(
        data.success ? "Push completed!" : `Push failed: ${data.data?.errors || "Unknown error"}`
      );
    } catch (err) {
      console.error(err);
      setMessage("Push failed due to network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Theme Sync</h2>
      <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
        <option value="">Select a theme</option>
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name} (ID: {theme.id})
          </option>
        ))}
      </select>

      <div style={{ marginTop: "10px" }}>
        <button type="button" onClick={handleBackup} disabled={loading}>
          Backup Settings
        </button>
        <button
          type="button"
          onClick={handlePush}
          disabled={loading || !backupData}
          style={{ marginLeft: "10px" }}
        >
          Push Settings
        </button>
      </div>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
