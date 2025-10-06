import { json } from '@remix-run/node'; // for server response
import { useFetcher } from '@remix-run/react'; // for form submission
import SettingsSyncForm from '../components/SettingsSyncForm'; // UI component

// Server-side imports
import { fetchSettings, pushSettings } from '../services/shopify.server.js';

export async function action({ request }) {
  const formData = await request.formData();
  const prodDomain = formData.get('prodDomain');
  const stageDomain = formData.get('stageDomain');

  if (!prodDomain || !stageDomain) {
    return json({ success: false, error: 'Both store domains are required' }, { status: 400 });
  }

  const prodToken = process.env.PROD_ACCESS_TOKEN;
  const stageToken = process.env.STAGE_ACCESS_TOKEN;

  try {
    const settings = await fetchSettings(prodDomain, prodToken);
    const result = await pushSettings(stageDomain, stageToken, settings);

    return json({ success: true, result });
  } catch (err) {
    console.error('Settings sync error:', err);
    return json({ success: false, error: err.message });
  }
}

export default function AppSettings() {
  const fetcher = useFetcher();

  const handleSync = (prodDomain, stageDomain) => {
    const formData = new FormData();
    formData.append('prodDomain', prodDomain);
    formData.append('stageDomain', stageDomain);

    fetcher.submit(formData, {
      method: 'post',
      action: '/api/sync/settings',
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Settings Sync Form */}
      <SettingsSyncForm onSync={handleSync} />

      {/* Show server response */}
      {fetcher.data?.success && (
        <p className="text-green-500">Settings synced successfully!</p>
      )}
      {fetcher.data?.error && (
        <p className="text-red-500"> Sync failed: {fetcher.data.error}</p>
      )}
    </div>
  );
}
