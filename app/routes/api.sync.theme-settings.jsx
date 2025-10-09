// app/routes/api/sync/theme-settings.jsx
import { json } from "@remix-run/node";
import fetch from "node-fetch";
import fs from "fs";

const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;
const STAGE_SHOP = process.env.STAGE_SHOP;
const STAGE_THEME_ID = process.env.STAGE_THEME_ID;

export const action = async ({ request }) => {
  const body = await request.json();
  const { action: act } = body;

  if (act === "backup") {
    try {
      // Fetch the settings_data.json from staging theme
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
        JSON.stringify(data.asset.value, null, 2) // save raw JSON string
      );

      // Return the raw JSON string to frontend
      return json({
        message: "Backup completed!",
        value: data.asset.value, // <- raw JSON string ready for push
      });
    } catch (err) {
      console.error("Stage backup failed:", err);
      return json({ error: "Stage backup failed" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
};
