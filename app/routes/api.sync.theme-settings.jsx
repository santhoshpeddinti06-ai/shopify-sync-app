// app/routes/api.sync.theme-settings.jsx
import { json } from "@remix-run/node";
import { fetchSettingsAsset, pushSettingsAsset } from "../utils/shopify-themes.server.js";

let localBackup = null; // stored in memory

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action");
    const themeId = formData.get("themeId");

    const PROD_SHOP = process.env.PROD_SHOP;
    const PROD_TOKEN = process.env.PROD_ACCESS_TOKEN;
    const STAGE_SHOP = process.env.STAGE_SHOP;
    const STAGE_TOKEN = process.env.STAGE_ACCESS_TOKEN;
    const STAGE_THEME_ID = process.env.VITE_STAGE_THEME_ID;

    if (actionType === "backup") {
      // Fetch settings from staging store
      const settingsData = await fetchSettingsAsset(STAGE_SHOP, STAGE_TOKEN, STAGE_THEME_ID);

      if (!settingsData) {
        return json({ success: false, message: "No settings found in staging theme." }, { status: 404 });
      }

      localBackup = settingsData;
      console.log("✅ Backup stored in memory from staging:", STAGE_THEME_ID);

      return json({
        success: true,
        message: `✅ Backup successful for staging theme ${STAGE_THEME_ID}`,
      });
    }

    if (actionType === "push") {
      if (!localBackup) {
        return json({ success: false, message: "No backup found. Please backup first." }, { status: 400 });
      }

      // Push to production store
      const pushed = await pushSettingsAsset(PROD_SHOP, PROD_TOKEN, themeId, localBackup);

      return json({
        success: true,
        message: `✅ Settings pushed successfully to production theme ${themeId}`,
        pushed,
      });
    }

    return json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("❌ Theme sync action error:", err);
    return json(
      { success: false, message: err.message || "Theme sync failed." },
      { status: 500 }
    );
  }
};
