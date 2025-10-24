export async function fetchSettingsAsset(shop, token, themeId) {
  const url = `https://${shop}/admin/api/2025-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`;
  try {
    const res = await fetch(url, { headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.asset?.value ?? null;
  } catch (err) {
    console.error("Fetch settings error:", err);
    return null;
  }
}

export async function pushSettingsAsset(shop, token, themeId, settings) {
  const url = `https://${shop}/admin/api/2025-10/themes/${themeId}/assets.json`;
  const body = { asset: { key: "config/settings_data.json", value: typeof settings === "string" ? settings : JSON.stringify(settings) } };
  try {
    const res = await fetch(url, { method: "PUT", headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return (await res.json()).asset;
  } catch (err) {
    console.error("Push settings error:", err);
    throw err;
  }
}
