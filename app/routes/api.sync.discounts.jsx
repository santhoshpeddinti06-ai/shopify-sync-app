// File: api/sync/discounts.jsx
import { json } from "@remix-run/node";

/**
 * Action for syncing discounts between stores.
 * Supports bi-directional sync based on `direction` from frontend.
 * direction: "stage-to-prod" or "prod-to-stage"
 */
export async function action({ request }) {
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
    // 1️⃣ Get direction from frontend
    const body = await request.json();
    const direction = body.direction || "stage-to-prod"; // default
    // 🔹 Comment: direction determines source and target stores

    const sourceShop = direction === "stage-to-prod" ? STAGE_SHOP : PROD_SHOP; // 🔹 source
    const sourceToken = direction === "stage-to-prod" ? STAGE_ACCESS_TOKEN : PROD_ACCESS_TOKEN;

    const targetShop = direction === "stage-to-prod" ? PROD_SHOP : STAGE_SHOP; // 🔹 target
    const targetToken = direction === "stage-to-prod" ? PROD_ACCESS_TOKEN : STAGE_ACCESS_TOKEN;

    // 2️⃣ Fetch discounts from source store
    const sourceRes = await fetch(
      `https://${sourceShop}/admin/api/2025-10/price_rules.json`,
      {
        headers: {
          "X-Shopify-Access-Token": sourceToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!sourceRes.ok) {
      const err = await sourceRes.text();
      throw new Error(`Failed to fetch discounts from source store: ${err}`);
    }

    const sourceData = await sourceRes.json();
    const sourceDiscounts = sourceData.price_rules || [];

    if (sourceDiscounts.length === 0) {
      return json({
        success: false,
        message: "No discounts found in source store.",
      });
    }

    // 3️⃣ Fetch existing discounts from target store
    const targetRes = await fetch(
      `https://${targetShop}/admin/api/2025-10/price_rules.json`,
      {
        headers: {
          "X-Shopify-Access-Token": targetToken,
          "Content-Type": "application/json",
        },
      }
    );

    const targetData = await targetRes.json();
    const targetDiscounts = targetData.price_rules || [];

    const results = [];

    // 4️⃣ Compare and sync
    for (const rule of sourceDiscounts) {
      const match = targetDiscounts.find(
        (t) => t.title === rule.title || t.id === rule.id
      );

      if (match) {
        results.push({
          title: rule.title,
          code: rule.title,
          value: rule.value,
          status: "✅ Exists in target store",
        });
        continue;
      }

      // 🔹 Build payload for creating new discount in target store
      try {
        const payload = {
          price_rule: {
            title: rule.title,
            target_type: rule.target_type || "line_item",
            target_selection: rule.target_selection || "all",
            allocation_method: rule.allocation_method || "across",
            value_type: rule.value_type || "percentage",
            value: rule.value,
            customer_selection: rule.customer_selection || "all",
            starts_at: rule.starts_at || new Date().toISOString(),
            entitled_product_ids: rule.entitled_product_ids || [],
            entitled_collection_ids: rule.entitled_collection_ids || [],
            entitled_variant_ids: rule.entitled_variant_ids || [],
          },
        };

        // 🛠 Ensure target_selection = all if no entitlements
        if (
          !payload.price_rule.entitled_product_ids.length &&
          !payload.price_rule.entitled_collection_ids.length &&
          !payload.price_rule.entitled_variant_ids.length
        ) {
          payload.price_rule.target_selection = "all";
        }

        const createRes = await fetch(
          `https://${targetShop}/admin/api/2025-10/price_rules.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": targetToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const createData = await createRes.json();

        if (createRes.ok) {
          results.push({
            title: rule.title,
            code: rule.title,
            value: rule.value,
            status: `✅ Created in target store`,
          });
        } else {
          results.push({
            title: rule.title,
            code: rule.title,
            value: rule.value,
            status: `❌ Failed to create (${JSON.stringify(createData)})`,
          });
        }
      } catch (err) {
        results.push({
          title: rule.title,
          code: rule.title,
          value: rule.value,
          status: `❌ Error: ${err.message}`,
        });
      }
    }

    // 5️⃣ Return results with direction info
    return json({
      success: true,
      message: `✅ Discounts synced successfully (${direction === "stage-to-prod" ? "staging → production" : "production → staging"})`,
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
