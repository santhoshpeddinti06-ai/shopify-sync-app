import { json } from "@remix-run/node";

const { STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN } = process.env;

// Fetch shipping zones from a store
async function fetchShippingZones(shop, token) {
  const res = await fetch(`https://${shop}/admin/api/2025-10/shipping_zones.json`, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data.shipping_zones;
}

export async function action() {
  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({
      success: false,
      message: "❌ Missing .env values (STAGE_SHOP, PROD_SHOP, etc.)",
    });
  }

  try {
    const [stagingZones, prodZones] = await Promise.all([
      fetchShippingZones(STAGE_SHOP, STAGE_ACCESS_TOKEN),
      fetchShippingZones(PROD_SHOP, PROD_ACCESS_TOKEN),
    ]);

    const results = stagingZones.map((zone) => {
      const match = prodZones.find((p) => p.name === zone.name);
      return {
        name: zone.name,
        countries: zone.countries.map((c) => c.name).join(", "),
        status: match ? "✅ Exists in production" : "⚠️ Missing in production",
      };
    });

    return json({
      success: true,
      message: "✅ Shipping zones fetched and compared successfully",
      results,
    });
  } catch (error) {
    console.error("❌ Shipping sync error:", error);
    return json({ success: false, message: error.message });
  }
}
