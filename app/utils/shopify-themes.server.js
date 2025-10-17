// app/utils/shopify-themes.server.js

/**
 * Fetch the settings_data.json asset for a theme.
 */
export async function fetchSettingsAsset(shop, token, themeId) {
  const assetUrl = `https://${shop}/admin/api/2025-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`;
  try {
    const res = await fetch(assetUrl, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to fetch settings asset: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data.asset?.value ?? null;
  } catch (err) {
    console.error(`❌ Error fetching settings asset for theme ${themeId} from ${shop}:`, err);
    return null;
  }
}

/**
 * Push the settings_data.json asset to a theme.
 */
export async function pushSettingsAsset(shop, token, themeId, settings) {
  const url = `https://${shop}/admin/api/2025-10/themes/${themeId}/assets.json`;
  const settingsString = typeof settings === "string" ? settings : JSON.stringify(settings);

  const body = {
    asset: {
      key: "config/settings_data.json",
      value: settingsString,
    },
  };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to push settings: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data.asset;
  } catch (err) {
    console.error(`❌ Error pushing settings to theme ${themeId} in ${shop}:`, err);
    throw err;
  }
}
