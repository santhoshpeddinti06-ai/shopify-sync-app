import { useState, useEffect } from "react";

export default function ThemeSync() {
  const [stagingThemes, setStagingThemes] = useState([]);
  const [selectedStagingTheme, setSelectedStagingTheme] = useState("");
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load staging themes
  useEffect(() => {
    async function fetchStagingThemes() {
      try {
        const res = await fetch("/api/sync/stage-themes");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch themes");
        setStagingThemes(data.themes || []);
      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to load staging themes");
      }
    }
    fetchStagingThemes();
  }, []);

  // Backup settings from staging
  const handleBackup = async () => {
    if (!selectedStagingTheme) return setMessage("⚠️ Select a staging theme first");
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/sync/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "backup",
          themeId: selectedStagingTheme,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backup failed");

      if (data.value) setBackupData(JSON.parse(data.value));
      setMessage("✅ Backup completed successfully");
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Push backup to production
  const handlePush = async () => {
    if (!backupData) return setMessage("⚠️ Please backup first");
    if (!window.confirm("Push these settings to production?")) return;

    setLoading(true);
    setMessage("");

    try {
      // Ensure numeric theme ID for Shopify
      const prodThemeId = parseInt(import.meta.env.VITE_PRODUCT_THEME_ID, 10);
      if (!prodThemeId) return setMessage("❌ Production theme ID is missing");

      const payload = { themeId: prodThemeId, settings: backupData };
      console.log("Push Payload:", payload);

      const res = await fetch("/api/sync/push-theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Push Response:", data);

      if (res.ok && data.success) {
        setMessage("✅ Pushed to production successfully");
      } else {
        setMessage(`❌ Push failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network or server error");
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
