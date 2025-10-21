import { json } from "@remix-run/node";

// ✅ Helper: Fetch menus via GraphQL
async function fetchMenusGraphQL(shop, token) {
  const url = `https://${shop}/admin/api/2025-01/graphql.json`;
  const query = `
    {
      menus(first: 50) {
        edges {
          node {
            id
            handle
            title
            items {
              title
              type
              url
            }
          }
        }
      }
    }
  `;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(
      `Failed to fetch menus from ${shop}: ${JSON.stringify(data.errors)}`
    );
  }

  const menus = data.data?.menus?.edges?.map((e) => e.node) || [];
  return menus;
}

// ✅ Main Remix action
export const action = async () => {
  const STAGE_SHOP = process.env.STAGE_SHOP;
  const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;
  const PROD_SHOP = process.env.PROD_SHOP;
  const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;

  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({
      success: false,
      message:
        "❌ Missing required .env values (STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN)",
    });
  }

  try {
    // Fetch menus from both stores
    const [stageMenus, prodMenus] = await Promise.all([
      fetchMenusGraphQL(STAGE_SHOP, STAGE_ACCESS_TOKEN),
      fetchMenusGraphQL(PROD_SHOP, PROD_ACCESS_TOKEN),
    ]);

    const results = [];
    const differences = [];

    for (const sMenu of stageMenus) {
      const match = prodMenus.find((m) => m.handle === sMenu.handle);

      if (!match) {
        results.push({
          title: sMenu.title,
          handle: sMenu.handle,
          status: "❌ Missing in Production",
        });
        differences.push(sMenu);
      } else {
        const sTitles = sMenu.items.map((i) => i.title);
        const pTitles = match.items.map((i) => i.title);
        const missing = sTitles.filter((t) => !pTitles.includes(t));
        const extra = pTitles.filter((t) => !sTitles.includes(t));

        if (missing.length || extra.length) {
          results.push({
            title: sMenu.title,
            handle: sMenu.handle,
            status: "⚠️ Items differ",
            missing,
            extra,
          });
          differences.push(sMenu);
        } else {
          results.push({
            title: sMenu.title,
            handle: sMenu.handle,
            status: "✅ Match",
          });
        }
      }
    }

    // (Optional) — You can later implement pushing changes via GraphQL mutations
    // For now, just returning the comparison result.

    return json({
      success: true,
      message:
        differences.length > 0
          ? "✅ Menu comparison done — differences found."
          : "✅ Menus are already synced.",
      results,
    });
  } catch (error) {
    console.error("❌ Menu sync error:", error);
    return json({ success: false, message: error.message });
  }
};
