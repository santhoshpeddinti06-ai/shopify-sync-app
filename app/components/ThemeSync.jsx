import { useEffect, useState } from "react";

export default function ThemeSync() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch themes from backend
  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/sync/themes");
        if (!res.ok) throw new Error("Failed to fetch themes");
        const data = await res.json();
        if (!data.themes) throw new Error("No themes returned");

        setThemes(data.themes);
        if (data.themes.length > 0) setSelectedTheme(data.themes[0].id);
      } catch (err) {
        console.error(err);
        setStatus("Error fetching themes: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchThemes();
  }, []);

  // Backup settings
  const handleBackup = async () => {
    if (!selectedTheme) return;
    setStatus("Backing up settings...");
    setActionInProgress(true);
    try {
      const res = await fetch("/api/sync/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: selectedTheme, action: "backup" }),
      });
      if (!res.ok) throw new Error("Backup failed");
      const data = await res.json();
      setStatus(data.message || "Backup completed!");
    } catch (err) {
      console.error(err);
      setStatus("Backup failed: " + err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Push settings
  const handlePush = async () => {
    if (!selectedTheme) return;
    setStatus("Pushing settings...");
    setActionInProgress(true);
    try {
      const res = await fetch("/api/sync/push-theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: selectedTheme }),
      });
      if (!res.ok) throw new Error("Push failed");
      const data = await res.json();
      setStatus(data.message || "Push completed!");
    } catch (err) {
      console.error(err);
      setStatus("Push failed: " + err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) return <p>Loading themes...</p>;
  if (themes.length === 0) return <p>No themes found.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Theme Sync Dashboard</h2>
      <p>Select a theme to backup or push settings:</p>

      <select
        value={selectedTheme}
        onChange={(e) => setSelectedTheme(e.target.value)}
        style={{ padding: "5px", marginBottom: "10px" }}
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name} (ID: {theme.id})
          </option>
        ))}
      </select>

      <div style={{ marginTop: "10px" }}>
        <button
          onClick={handleBackup}
          disabled={actionInProgress}
          style={{ marginRight: "10px" }}
        >
          Backup Settings
        </button>
        <button onClick={handlePush} disabled={actionInProgress}>
          Push Settings
        </button>
      </div>

      {status && <p style={{ marginTop: "10px" }}>{status}</p>}
    </div>
  );
}
