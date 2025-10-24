// app/routes/api.sync.theme-settings.jsx
import fs from "fs";
import path from "path";
import { json } from "@remix-run/node";

/**
 * Backup and push Shopify theme settings (staging → production)
 */
export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action"); // "backup" or "push"

    // Env variables
    const PROD_SHOP = process.env.PROD_SHOP;
    const PROD_TOKEN = process.env.PROD_ACCESS_TOKEN;
    const PROD_THEME_ID = process.env.VITE_PRODUCT_THEME_ID;

    const STAGE_SHOP = process.env.STAGE_SHOP;
    const STAGE_TOKEN = process.env.STAGE_ACCESS_TOKEN;
    const STAGE_THEME_ID = process.env.VITE_STAGE_THEME_ID;

    // Prepare local backup folder
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    // -----------------------------
    // 1️⃣ Backup from staging
    // -----------------------------
    if (actionType === "backup") {
      const stageRes = await fetch(
        `https://${STAGE_SHOP}/admin/api/2025-10/themes/${STAGE_THEME_ID}/assets.json?asset[key]=config/settings_data.json`,
        { headers: { "X-Shopify-Access-Token": STAGE_TOKEN } }
      );

      if (!stageRes.ok) {
        const txt = await stageRes.text();
        throw new Error(`Failed to fetch staging settings: ${stageRes.status} ${txt}`);
      }

      const stageData = await stageRes.json();
      const settingsJSON = stageData.asset?.value;
      if (!settingsJSON) throw new Error("No settings_data.json found in staging theme");

      // Store backup in memory
      global.stageBackup = settingsJSON;

      // Save locally
      const backupPath = path.join(
        backupDir,
        `settings_backup_stage-to-prod_${Date.now()}.json`
      );
      fs.writeFileSync(backupPath, settingsJSON, "utf8");

      return json({
        success: true,
        message: `✅ Backup successful for staging theme ${STAGE_THEME_ID}. Saved at ${backupPath}`,
      });
    }

    // -----------------------------
    // 2️⃣ Push to production
    // -----------------------------
    if (actionType === "push") {
      if (!global.stageBackup) {
        return json({ success: false, message: "No backup found. Please backup first." });
      }

      // Strip comments (/* ... */) before pushing
      const cleanSettingsJSON = global.stageBackup.replace(/\/\*[\s\S]*?\*\//g, "").trim();

      const pushRes = await fetch(
        `https://${PROD_SHOP}/admin/api/2025-10/themes/${PROD_THEME_ID}/assets.json`,
        {
          method: "PUT",
          headers: {
            "X-Shopify-Access-Token": PROD_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            asset: {
              key: "config/settings_data.json",
              value: cleanSettingsJSON,
            },
          }),
        }
      );

      const pushText = await pushRes.text();
      if (!pushRes.ok) throw new Error(`Failed: ${pushText}`);

      return json({
        success: true,
        message: `✅ Settings pushed successfully to production theme ${PROD_THEME_ID}`,
      });
    }

    return json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("❌ Theme sync error:", err);
    return json({ success: false, message: `❌ Failed: ${err.message}` });
  }
};
