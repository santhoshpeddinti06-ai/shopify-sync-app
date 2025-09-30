import { useState } from 'react';

export default function SettingsSyncForm({ onSync }) {
  const [prodDomain, setProdDomain] = useState('');
  const [stageDomain, setStageDomain] = useState('');

  const handleSync = () => {
    onSync(prodDomain, stageDomain);
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-2">Sync Shopify Settings</h2>
      <input
        type="text"
        placeholder="Production Store Domain"
        value={prodDomain}
        onChange={(e) => setProdDomain(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <input
        type="text"
        placeholder="Stage Store Domain"
        value={stageDomain}
        onChange={(e) => setStageDomain(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <button onClick={handleSync} className="bg-blue-500 text-white p-2 rounded">
        Sync Settings
      </button>
    </div>
  );
}
