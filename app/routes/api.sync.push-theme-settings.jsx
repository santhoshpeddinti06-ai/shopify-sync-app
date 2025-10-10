// app/routes/api/sync/push-theme-settings.jsx
import { json } from "@remix-run/node";
import fetch from "node-fetch";

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { themeId, settings } = body;

    if (!themeId || !settings) {
      return json({ success: false, error: "Missing themeId or settings" }, { status: 400 });
    }

    // Use PROD shop and token from .env
    const SHOP = process.env.PROD_SHOP;
    const ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;

    if (!SHOP || !ACCESS_TOKEN) {
      return json({ success: false, error: "Missing PROD_SHOP or PROD_ACCESS_TOKEN" }, { status: 500 });
    }

    // Prepare payload: Shopify requires 'value' to be a string
    const payload = {
      asset: {
        key: "config/settings_data.json",
        value: JSON.stringify(settings),
      },
    };

    const url = `https://${SHOP}/admin/api/2025-10/themes/${themeId}/assets.json`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return json({ success: false, data }, { status: response.status });
    }

    return json({ success: true, data });
  } catch (error) {
    console.error("Push Theme Settings Error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
