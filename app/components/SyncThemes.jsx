
import { useEffect, useState } from "react";

export default function SyncThemes() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch themes from production store when component loads
  useEffect(() => {
    fetch("/api/sync/themes", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.themes) setThemes(data.themes);
      })
      .catch(err => console.error("Failed to fetch themes:", err));
  }, []);

  // Handle sync button click
  const syncTheme = async () => {
    if (!selectedTheme) return alert("Please select a theme first!");
    setLoading(true);

    // Placeholder for now (future: push theme to staging)
    const res = await fetch("/api/sync/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId: selectedTheme }) // for future use
    });

    const data = await res.json();
    alert(data.message || "Theme sync triggered (backend push not implemented yet)");
    setLoading(false);
  };

  return (
    <div>
      <h2>Theme Sync</h2>
      <select
        value={selectedTheme}
        onChange={(e) => setSelectedTheme(e.target.value)}
      >
        <option value="">Select a theme</option>
        {themes.map(theme => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
      <button onClick={syncTheme} disabled={loading}>
        {loading ? "Syncing..." : "Sync Theme → Stage"}
      </button>
    </div>
  );
}
