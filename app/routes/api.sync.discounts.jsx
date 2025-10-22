import { json } from "@remix-run/node";

// Helper for Shopify REST API requests
async function shopifyREST(shop, token, endpoint) {
  const res = await fetch(`https://${shop}/admin/api/2025-10/${endpoint}`, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`❌ REST API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

// Fetch all price rules and discount codes
async function fetchDiscounts(shop, token) {
  const priceRulesData = await shopifyREST(shop, token, "price_rules.json?limit=250");
  const discounts = [];

  for (const rule of priceRulesData.price_rules) {
    // Fetch discount codes for each price rule
    const codesData = await shopifyREST(shop, token, `price_rules/${rule.id}/discount_codes.json`);
    for (const code of codesData.discount_codes) {
      discounts.push({
        id: rule.id,
        title: rule.title,
        code: code.code,
        value: rule.value,
        valueType: rule.value_type,
        targetType: rule.target_type,
      });
    }
  }

  return discounts;
}

export async function action() {
  const { STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN } = process.env;

  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({
      success: false,
      message: "❌ Missing .env values (STAGE_SHOP, PROD_SHOP, etc.)",
    });
  }

  try {
    const [stagingDiscounts, prodDiscounts] = await Promise.all([
      fetchDiscounts(STAGE_SHOP, STAGE_ACCESS_TOKEN),
      fetchDiscounts(PROD_SHOP, PROD_ACCESS_TOKEN),
    ]);

    // Compare discounts by title and code
    const results = stagingDiscounts.map((sDiscount) => {
      const match = prodDiscounts.find(
        (pDiscount) => pDiscount.title === sDiscount.title && pDiscount.code === sDiscount.code
      );
      return {
        title: sDiscount.title,
        code: sDiscount.code,
        value: sDiscount.value,
        status: match ? "✅ Exists in production" : "⚠️ Missing in production",
      };
    });

    return json({
      success: true,
      message: "✅ Discounts fetched and compared successfully.",
      results,
    });
  } catch (error) {
    console.error("❌ Discount sync error:", error);
    return json({ success: false, message: error.message });
  }
}
