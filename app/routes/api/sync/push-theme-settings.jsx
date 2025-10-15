import { json } from "@remix-run/node";
import fetch from "node-fetch"; // Node fetch for local dev

// Production store env variables
const PROD_SHOP = process.env.PROD_SHOP;
const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { themeId, settings } = body;

    // Validate inputs
    if (!themeId || !settings) {
      return json({ error: "Missing themeId or settings" }, { status: 400 });
    }

    if (!PROD_SHOP || !PROD_ACCESS_TOKEN) {
      return json({ error: "Production environment variables missing" }, { status: 500 });
    }

    // Shopify PUT request to update settings_data.json
    const url = `https://${PROD_SHOP}/admin/api/2025-10/themes/${themeId}/assets.json`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": PROD_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset: {
          key: "config/settings_data.json",
          value: JSON.stringify(settings),
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Shopify push error:", data);
      return json({ error: "Failed to push settings", details: data }, { status: response.status });
    }

    return json({ success: true, message: "Settings pushed successfully ✅", data });

  } catch (err) {
    console.error("Push failed:", err);
    return json({ error: "Push failed", details: err.message }, { status: 500 });
  }
};
