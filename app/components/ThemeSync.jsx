import { useState, useEffect } from "react";

export default function ThemeSync() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch available themes (from stage store)
  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/sync/stage-themes");
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
    if (!selectedTheme) return setMessage("Please select a theme first");
    setLoading(true);

    try {
      const res = await fetch("/api/sync/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: selectedTheme, action: "backup" }),
      });

      const data = await res.json();
      if (data.value) {
        setBackupData(JSON.parse(data.value)); // always store as object
      }
      setMessage(data.message || "Backup completed!");
    } catch (err) {
      console.error(err);
      setMessage("Backup failed");
    } finally {
      setLoading(false);
    }
  };

  // Push handler
  const handlePush = async () => {
    if (!selectedTheme) return setMessage("Please select a theme first");
    if (!backupData) return setMessage("Please create a backup first");
    if (!window.confirm("Are you sure you want to push settings to production?")) return;

    setLoading(true);
    try {
      const payload = {
        themeId: import.meta.env.VITE_PRODUCT_THEME_ID,
        settings: backupData,
      };

      console.log("PUSH PAYLOAD:", payload);

      const res = await fetch("/api/sync/push-theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Push failed:", data);
        setMessage(`Push failed: ${data.data?.errors || data.error || "Unknown error"}`);
      } else {
        setMessage("Push completed successfully!");
      }
    } catch (err) {
      console.error("Push error:", err);
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

      <div style={{ marginTop: 10 }}>
        <button onClick={handleBackup} disabled={loading}>Backup Settings</button>
        <button onClick={handlePush} disabled={loading || !backupData} style={{ marginLeft: 10 }}>
          Push Settings
        </button>
      </div>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}
