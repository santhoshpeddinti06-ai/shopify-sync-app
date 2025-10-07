// app/routes/api.sync.theme-settings.jsx
import { json } from "@remix-run/node";
import fetch from "node-fetch";
import fs from "fs";

const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;
const PROD_SHOP = process.env.PROD_SHOP;

const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;
const STAGE_SHOP = process.env.STAGE_SHOP;
const STAGE_THEME_ID = process.env.STAGE_THEME_ID; // ID of stage theme

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const themeId = url.searchParams.get("theme_id");

  if (!themeId) {
    return json({ error: "theme_id is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://${PROD_SHOP}/admin/api/2025-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": PROD_ACCESS_TOKEN,
        },
      }
    );

    const data = await response.json();
    return json({ settings: data.asset });
  } catch (err) {
    console.error("Error fetching production theme settings:", err);
    return json({ error: "Failed to fetch theme settings" }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  const body = await request.json();
  const { action: act } = body;

  if (act === "backup") {
    try {
      const response = await fetch(
        `https://${STAGE_SHOP}/admin/api/2025-10/themes/${STAGE_THEME_ID}/assets.json?asset[key]=config/settings_data.json`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": STAGE_ACCESS_TOKEN,
          },
        }
      );

      const data = await response.json();

      // Save backup locally
      if (!fs.existsSync("./backups")) fs.mkdirSync("./backups");
      fs.writeFileSync(
        "./backups/settings_stage.json",
        JSON.stringify(data.asset, null, 2)
      );

      return json({ success: true, data: data.asset });
    } catch (err) {
      console.error("Stage backup failed:", err);
      return json({ error: "Stage backup failed" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
};
