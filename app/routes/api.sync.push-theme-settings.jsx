// app/routes/api.sync.push-theme-settings.jsx
import { json } from "@remix-run/node";
import fetch from "node-fetch";

const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;
const STAGE_SHOP = process.env.STAGE_SHOP;
const STAGE_THEME_ID = process.env.STAGE_THEME_ID; // ID of stage theme

export const action = async ({ request }) => {
  const body = await request.json();
  const { theme_id, settings } = body;

  if (!theme_id || !settings) {
    return json({ error: "theme_id and settings are required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://${STAGE_SHOP}/admin/api/2025-10/themes/${STAGE_THEME_ID}/assets.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": STAGE_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          asset: {
            key: "config/settings_data.json",
            value: JSON.stringify(settings),
          },
        }),
      }
    );

    const data = await response.json();
    return json({ success: true, data });
  } catch (err) {
    console.error("Error pushing theme settings to stage:", err);
    return json({ error: "Failed to push theme settings" }, { status: 500 });
  }
};
