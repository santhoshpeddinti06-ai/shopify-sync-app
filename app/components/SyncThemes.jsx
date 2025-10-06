import { useState, useEffect } from 'react';
import { Card, Button, Select, Spinner, Text } from '@shopify/polaris';

export default function SyncThemes() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchThemes() {
      setLoading(true);
      setMessage('');
      try {
        const res = await fetch('/api/sync/themes');
        const data = await res.json();
        if (data.success) {
          setThemes(data.themes || []);
        } else {
          setMessage('Failed to fetch themes: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        setMessage('Failed to fetch themes: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchThemes();
  }, []);

  const handleSync = async () => {
    if (!selectedTheme) return setMessage('Select a theme first!');
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/sync/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: selectedTheme }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Theme synced successfully!');
      } else {
        setMessage(' Sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setMessage('Sync failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sectioned>
      <Select
        label="Select Production Theme"
        options={themes.map(t => ({ label: t.name, value: t.id }))}
        onChange={setSelectedTheme}
        value={selectedTheme}
      />
      <Button primary onClick={handleSync} disabled={loading}>
        {loading ? <Spinner size="small" /> : 'Sync Theme'}
      </Button>
      {message && <Text>{message}</Text>}
    </Card>
  );
}
