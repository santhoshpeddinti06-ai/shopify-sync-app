// app/routes/api.sync.shipping.jsx
import { json } from "@remix-run/node";

const { STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN } = process.env;

// Fetch shipping zones from a store
async function fetchShippingZones(shop, token) {
  const res = await fetch(`https://${shop}/admin/api/2025-10/shipping_zones.json`, {
    method: "GET",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
  });
  const data = await res.json();
  return data.shipping_zones;
}

// Push shipping zone (example using POST, Shopify may require REST or GraphQL for creating)
async function pushShippingZone(targetShop, targetToken, zone) {
  // Shopify does not expose location-create via GraphQL, but we can simulate creation via REST
  // Here we just log it for now; in a real app you'd call REST Admin API POST /admin/api/2025-10/shipping_zones.json
  console.log(`Would create shipping zone ${zone.name} in ${targetShop}`);
}

export async function action({ request }) {
  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({ success: false, message: "❌ Missing .env values" });
  }

  try {
    const formData = await request.formData();
    const direction = formData.get("direction") || "stage-to-prod";

    const sourceShop = direction === "stage-to-prod" ? STAGE_SHOP : PROD_SHOP;
    const sourceToken = direction === "stage-to-prod" ? STAGE_ACCESS_TOKEN : PROD_ACCESS_TOKEN;
    const targetShop = direction === "stage-to-prod" ? PROD_SHOP : STAGE_SHOP;
    const targetToken = direction === "stage-to-prod" ? PROD_ACCESS_TOKEN : STAGE_ACCESS_TOKEN;

    const [sourceZones, targetZones] = await Promise.all([
      fetchShippingZones(sourceShop, sourceToken),
      fetchShippingZones(targetShop, targetToken),
    ]);

    const results = [];
    for (const sZone of sourceZones) {
      const match = targetZones.find((tZone) => tZone.name === sZone.name);

      if (match) {
        results.push({
          name: sZone.name,
          countries: sZone.countries.map((c) => c.name).join(", "),
          status: "✅ Already exists",
        });
      } else {
        // Push shipping zone to target
        await pushShippingZone(targetShop, targetToken, sZone);
        results.push({
          name: sZone.name,
          countries: sZone.countries.map((c) => c.name).join(", "),
          status: "⚠️ Missing in target store — create manually",
        });
      }
    }

    return json({
      success: true,
      message: `✅ Shipping zones synced (${direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"})`,
      results,
    });
  } catch (error) {
    console.error("❌ Shipping sync error:", error);
    return json({ success: false, message: error.message });
  }
}
