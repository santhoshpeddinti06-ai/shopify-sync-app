// app/routes/api.sync.menus.jsx
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action");

    const PROD_SHOP = process.env.PROD_SHOP;
    const PROD_TOKEN = process.env.PROD_ACCESS_TOKEN;
    const STAGE_SHOP = process.env.STAGE_SHOP;
    const STAGE_TOKEN = process.env.STAGE_ACCESS_TOKEN;

    let backupMenus = [];

    if (actionType === "backup") {
      // Fetch all menus from staging
      const url = `https://${STAGE_SHOP}/admin/api/2025-10/menus.json`;
      const res = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": STAGE_TOKEN,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      backupMenus = data.menus || [];
      global.menuBackup = backupMenus; // store in memory

      return json({
        success: true,
        message: `✅ Backed up ${backupMenus.length} menus from staging.`,
      });
    }

    if (actionType === "push") {
      if (!global.menuBackup || global.menuBackup.length === 0) {
        return json({ success: false, message: "No menus backed up yet." });
      }

      // Push each menu to production
      let pushed = [];
      for (const menu of global.menuBackup) {
        const createUrl = `https://${PROD_SHOP}/admin/api/2025-10/menus.json`;
        const res = await fetch(createUrl, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": PROD_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ menu }),
        });

        if (!res.ok) {
          console.warn(`⚠️ Failed to push menu: ${menu.title}`);
          continue;
        }

        const result = await res.json();
        pushed.push(result.menu);
      }

      return json({
        success: true,
        message: `✅ Pushed ${pushed.length} menus to production.`,
      });
    }

    return json({ success: false, message: "Invalid action." });
  } catch (err) {
    console.error("❌ Menu sync failed:", err);
    return json({ success: false, message: err.message || "Menu sync failed." }, { status: 500 });
  }
};
