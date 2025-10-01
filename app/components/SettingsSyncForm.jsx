import { useState } from 'react';
import { Card, FormLayout, TextField, Button, Text, Spinner } from '@shopify/polaris';

export default function SettingsSyncForm() {
  // Pre-filled dev store domains
  const [prodDomain, setProdDomain] = useState('santosh-dev.myshopify.com');
  const [stageDomain] = useState('santosh-dev2.myshopify.com'); // read-only
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/sync/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prodDomain, stageDomain }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Settings synced successfully!');
      } else {
        setMessage('Sync failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      // console.error(err);
      setMessage('Sync failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sectioned>
      <Text variant="headingLg" as="h2">
        Sync Shopify Settings
      </Text>
      <FormLayout>
        <TextField
          label="Production Store Domain"
          value={prodDomain}
          onChange={setProdDomain}
          placeholder="e.g., santosh-dev.myshopify.com"
        />
        <TextField
          label="Stage Store Domain"
          value={stageDomain}
          readOnly
        />
        <Button primary onClick={handleSync} disabled={loading}>
          {loading ? <Spinner size="small" /> : 'Sync Settings'}
        </Button>
        {message && <Text variant="bodyMd">{message}</Text>}
      </FormLayout>
    </Card>
  );
}
