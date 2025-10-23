import { json } from "@remix-run/node";

// Shopify GraphQL request helper
async function shopifyGraphQL(shop, token, query, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors, null, 2));
  return data.data;
}

// Fetch locations from a store
async function fetchLocations(shop, token) {
  const query = `
    {
      locations(first: 50) {
        edges {
          node {
            id
            name
            address {
              address1
              city
              province
              country
              zip
            }
          }
        }
      }
    }
  `;
  const data = await shopifyGraphQL(shop, token, query);
  return data.locations.edges.map((e) => e.node);
}

// ----------------- Action -----------------
export async function action({ request }) {
  const { STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN } = process.env;

  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({ success: false, message: "❌ Missing .env values" });
  }

  try {
    const formData = await request.formData();
    const direction = formData.get("direction") || "stage-to-prod";

    // Decide source and target based on direction
    const sourceShop = direction === "stage-to-prod" ? STAGE_SHOP : PROD_SHOP;
    const sourceToken = direction === "stage-to-prod" ? STAGE_ACCESS_TOKEN : PROD_ACCESS_TOKEN;

    const targetShop = direction === "stage-to-prod" ? PROD_SHOP : STAGE_SHOP;
    const targetToken = direction === "stage-to-prod" ? PROD_ACCESS_TOKEN : STAGE_ACCESS_TOKEN;

    const [sourceLocations, targetLocations] = await Promise.all([
      fetchLocations(sourceShop, sourceToken),
      fetchLocations(targetShop, targetToken),
    ]);

    // Compare locations
    const results = sourceLocations.map((sLoc) => {
      const match = targetLocations.find((tLoc) => tLoc.name === sLoc.name);
      return {
        name: sLoc.name,
        address: `${sLoc.address.address1}, ${sLoc.address.city}, ${sLoc.address.province}, ${sLoc.address.country}, ${sLoc.address.zip}`,
        status: match
          ? "✅ Already exists in target store"
          : "⚠️ Missing in target store",
      };
    });

    return json({
      success: true,
      direction,
      message: `✅ Locations compared successfully (${direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"})`,
      results,
    });
  } catch (error) {
    console.error("❌ Location sync error:", error);
    return json({ success: false, message: error.message });
  }
}
