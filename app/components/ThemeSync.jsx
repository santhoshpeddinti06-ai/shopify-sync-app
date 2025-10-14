import { useState, useEffect } from "react";

export default function ThemeSync() {
  const [stagingThemes, setStagingThemes] = useState([]);
  const [selectedStagingTheme, setSelectedStagingTheme] = useState("");
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch staging themes from backend
  useEffect(() => {
    async function fetchStagingThemes() {
      try {
        const res = await fetch("/api/sync/stage-themes");
        if (!res.ok) throw new Error(`Failed to fetch themes: ${res.status}`);
        const data = await res.json();
        setStagingThemes(data.themes || []);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load staging themes");
      }
    }
    fetchStagingThemes();
  }, []);

  // Backup settings from staging
  const handleBackup = async () => {
    if (!selectedStagingTheme) return setMessage("Select a staging theme first");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/sync/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "backup",
          themeId: selectedStagingTheme, // send selected theme ID
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Backup failed");

      if (data.value) setBackupData(JSON.parse(data.value));
      setMessage(data.message || "Backup completed ✅");
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Push backup to production
  const handlePush = async () => {
    if (!backupData) return setMessage("Please create a backup first");
    if (!window.confirm("Push backup to production theme?")) return;

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        themeId: parseInt(import.meta.env.VITE_PRODUCT_THEME_ID),
        settings: backupData,
      };

      const res = await fetch("/api/sync/push-theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("Push completed successfully ✅");
      } else {
        setMessage(`Push failed: ${data.errors || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Theme Sync</h2>

      <label>
        Select Staging Theme:
        <select
          value={selectedStagingTheme}
          onChange={(e) => setSelectedStagingTheme(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="">Select a theme</option>
          {stagingThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name} (ID: {theme.id})
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 10 }}>
        <button onClick={handleBackup} disabled={loading}>
          Backup Settings
        </button>
        <button
          onClick={handlePush}
          disabled={loading || !backupData}
          style={{ marginLeft: 10 }}
        >
          Push to Production
        </button>
      </div>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}
