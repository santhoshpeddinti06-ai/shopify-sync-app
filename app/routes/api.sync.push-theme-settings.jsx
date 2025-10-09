import { json } from "@remix-run/node";
import fetch from "node-fetch";

const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;
const PROD_SHOP = process.env.PROD_SHOP;

export const action = async ({ request }) => {
  try {
    const { theme_id, settings } = await request.json();

    if (!theme_id || !settings) {
      return json({ success: false, error: "Missing theme_id or settings" }, { status: 400 });
    }

    // Push settings to production theme
    const response = await fetch(`https://${PROD_SHOP}/admin/api/2025-10/themes/${theme_id}/assets.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": PROD_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        asset: {
          key: "config/settings_data.json",
          value: JSON.stringify(settings), // Shopify requires string
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("Shopify API Error:", data);
      return json({ success: false, data }, { status: 400 });
    }

    return json({ success: true, data });
  } catch (err) {
    console.error("Error pushing theme settings:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
};
