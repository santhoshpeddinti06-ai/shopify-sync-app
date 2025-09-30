import { json } from '@remix-run/node'; // for server response
import { useFetcher } from '@remix-run/react'; // for form submission
import SettingsSyncForm from '../components/SettingsSyncForm'; // UI component

// ✅ Only server-side import
import { fetchSettings, pushSettings } from '../services/shopify.server.js';

export async function action({ request }) {
  const formData = await request.formData();
  const prodDomain = formData.get('prodDomain');
  const stageDomain = formData.get('stageDomain');

  const prodToken = process.env.PROD_SHOPIFY_ACCESS_TOKEN;
  const stageToken = process.env.STAGE_SHOPIFY_ACCESS_TOKEN;

  const settings = await fetchSettings(prodDomain, prodToken);
  const result = await pushSettings(stageDomain, stageToken, settings);

  return json({ success: true, result });
}

export default function AppSettings() {
  const fetcher = useFetcher();

  const handleSync = (prodDomain, stageDomain) => {
    const formData = new FormData();
    formData.append('prodDomain', prodDomain);
    formData.append('stageDomain', stageDomain);

    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <div>
      <SettingsSyncForm onSync={handleSync} />
      {fetcher.data?.success && <p className="text-green-500">Settings synced successfully!</p>}
    </div>
  );
}
