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

export async function action() {
  const { STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN } = process.env;

  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({
      success: false,
      message: "❌ Missing .env values (STAGE_SHOP, PROD_SHOP, etc.)",
    });
  }

  try {
    // Fetch locations from both stores
    const [stagingLocations, prodLocations] = await Promise.all([
      fetchLocations(STAGE_SHOP, STAGE_ACCESS_TOKEN),
      fetchLocations(PROD_SHOP, PROD_ACCESS_TOKEN),
    ]);

    // Compare locations
    const results = stagingLocations.map((sLoc) => {
      const match = prodLocations.find((pLoc) => pLoc.name === sLoc.name);
      return {
        name: sLoc.name,
        address: `${sLoc.address.address1}, ${sLoc.address.city}, ${sLoc.address.province}, ${sLoc.address.country}, ${sLoc.address.zip}`,
        status: match ? "✅ Exists in production" : "⚠️ Missing in production",
      };
    });

    return json({
      success: true,
      message: "✅ Locations fetched and compared successfully.",
      results,
    });
  } catch (error) {
    console.error("❌ Location sync error:", error);
    return json({ success: false, message: error.message });
  }
}
