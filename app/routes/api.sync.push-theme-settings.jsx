import { json } from "@remix-run/node";
import fetch from "node-fetch";
import fs from "fs";

const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;
const STAGE_SHOP = process.env.STAGE_SHOP;

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { action: act, themeId } = body;

    if (act !== "backup") {
      return json({ error: "Invalid action" }, { status: 400 });
    }

    if (!themeId) {
      return json({ error: "Missing themeId" }, { status: 400 });
    }

    if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN) {
      return json({ error: "Missing staging environment variables" }, { status: 500 });
    }

    // Fetch settings_data.json from staging theme
    const url = `https://${STAGE_SHOP}/admin/api/2025-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": STAGE_ACCESS_TOKEN,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Shopify API error:", data);
      return json({ error: "Stage backup failed", details: data }, { status: response.status });
    }

    if (!data.asset || !data.asset.value) {
      console.error("No asset found:", data);
      return json({ error: "Stage backup failed: No settings found" }, { status: 500 });
    }

    // Save backup locally
    if (!fs.existsSync("./backups")) fs.mkdirSync("./backups");
    fs.writeFileSync("./backups/settings_stage.json", data.asset.value);

    return json({
      message: "Backup completed!",
      value: data.asset.value, // raw JSON string for push
    });
  } catch (err) {
    console.error("Stage backup failed:", err);
    return json({ error: "Stage backup failed", details: err.message }, { status: 500 });
  }
};
