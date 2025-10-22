import { json } from "@remix-run/node";

export async function action() {
  const STAGE_SHOP = process.env.STAGE_SHOP;
  const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;
  const PROD_SHOP = process.env.PROD_SHOP;
  const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;

  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({
      success: false,
      message:
        "Missing required environment variables for syncing discounts. Please check .env file.",
    });
  }

  try {
    // 1️⃣ Fetch discounts (price rules) from staging store
    const stageRes = await fetch(
      `https://${STAGE_SHOP}/admin/api/2025-10/price_rules.json`,
      {
        headers: {
          "X-Shopify-Access-Token": STAGE_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (!stageRes.ok) {
      const err = await stageRes.text();
      throw new Error(`Failed to fetch staging discounts: ${err}`);
    }

    const stageData = await stageRes.json();
    const stageDiscounts = stageData.price_rules || [];

    if (stageDiscounts.length === 0) {
      return json({
        success: false,
        message: "No discounts found in staging store.",
      });
    }

    // 2️⃣ Fetch existing discounts from production store
    const prodRes = await fetch(
      `https://${PROD_SHOP}/admin/api/2025-10/price_rules.json`,
      {
        headers: {
          "X-Shopify-Access-Token": PROD_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const prodData = await prodRes.json();
    const prodDiscounts = prodData.price_rules || [];

    const results = [];

    // 3️⃣ Compare and sync
    for (const sRule of stageDiscounts) {
      const match = prodDiscounts.find(
        (p) => p.title === sRule.title || p.id === sRule.id
      );

      if (match) {
        results.push({
          title: sRule.title,
          code: sRule.title,
          value: sRule.value,
          status: "✅ Exists in production",
        });
        continue;
      }

      // 🧠 Build payload for creating new discount in production
      try {
        const createPayload = {
          price_rule: {
            title: sRule.title,
            target_type: sRule.target_type || "line_item",
            target_selection: sRule.target_selection || "all",
            allocation_method: sRule.allocation_method || "across",
            value_type: sRule.value_type || "percentage",
            value: sRule.value,
            customer_selection: sRule.customer_selection || "all",
            starts_at: sRule.starts_at || new Date().toISOString(),

            // Include entitlements (if any)
            entitled_product_ids: sRule.entitled_product_ids || [],
            entitled_collection_ids: sRule.entitled_collection_ids || [],
            entitled_variant_ids: sRule.entitled_variant_ids || [],
          },
        };

        // 🛠 If no entitlements are present, apply discount to all
        if (
          !createPayload.price_rule.entitled_product_ids.length &&
          !createPayload.price_rule.entitled_collection_ids.length &&
          !createPayload.price_rule.entitled_variant_ids.length
        ) {
          createPayload.price_rule.target_selection = "all";
        }

        // 4️⃣ Create price rule in production
        const createRes = await fetch(
          `https://${PROD_SHOP}/admin/api/2025-10/price_rules.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": PROD_ACCESS_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(createPayload),
          }
        );

        const createData = await createRes.json();

        if (createRes.ok) {
          results.push({
            title: sRule.title,
            code: sRule.title,
            value: sRule.value,
            status: "✅ Created in production",
          });
        } else {
          results.push({
            title: sRule.title,
            code: sRule.title,
            value: sRule.value,
            status: `❌ Failed to create (${JSON.stringify(createData)})`,
          });
        }
      } catch (err) {
        results.push({
          title: sRule.title,
          code: sRule.title,
          value: sRule.value,
          status: `❌ Error: ${err.message}`,
        });
      }
    }

    // ✅ Return sync results
    return json({
      success: true,
      message: "✅ Discounts synced successfully.",
      results,
    });
  } catch (error) {
    console.error("Discount sync error:", error);
    return json({
      success: false,
      message: `🚨 Discount sync failed: ${error.message}`,
    });
  }
}
