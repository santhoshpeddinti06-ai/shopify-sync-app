import { json } from "@remix-run/node";

// Helper for making Shopify GraphQL requests
async function shopifyGraphQL(shop, token, query, variables = {}) {
  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors, null, 2));
  return data.data;
}

// Fetch all menus
async function fetchMenus(shop, token) {
  const query = `
    {
      menus(first: 50) {
        edges {
          node {
            id
            handle
            title
            items {
              id
              title
              type
              url
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL(shop, token, query);
  return data.menus.edges.map((e) => e.node);
}

export async function action() {
  const { STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN } = process.env;

  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN || !PROD_SHOP || !PROD_ACCESS_TOKEN) {
    return json({
      success: false,
      message: "❌ Missing required .env values (STAGE_SHOP, PROD_SHOP, etc.)",
    });
  }

  try {
    // ✅ Fetch menus from both stores
    const [stageMenus, prodMenus] = await Promise.all([
      fetchMenus(STAGE_SHOP, STAGE_ACCESS_TOKEN),
      fetchMenus(PROD_SHOP, PROD_ACCESS_TOKEN),
    ]);

    const results = [];

    for (const sMenu of stageMenus) {
      const match = prodMenus.find((m) => m.handle === sMenu.handle);

      // --------------------------
      // 🆕 CASE 1: Missing menu → CREATE
      // --------------------------
      if (!match) {
        const createMutation = `
          mutation menuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
            menuCreate(title: $title, handle: $handle, items: $items) {
              menu { id title handle }
              userErrors { field message }
            }
          }
        `;

        const variables = {
          title: sMenu.title,
          handle: sMenu.handle,
          items: sMenu.items.map((i) => ({
            title: i.title,
            type: i.type,
            url: i.url,
          })),
        };

        const result = await shopifyGraphQL(PROD_SHOP, PROD_ACCESS_TOKEN, createMutation, variables);
        const errors = result.menuCreate.userErrors;

        if (errors?.length) {
          results.push({
            title: sMenu.title,
            handle: sMenu.handle,
            status: `⚠️ Failed to create: ${errors[0].message}`,
          });
        } else {
          results.push({
            title: sMenu.title,
            handle: sMenu.handle,
            status: "✅ Created in Production",
          });
        }
        continue;
      }

      // --------------------------
      // ✏️ CASE 2: Existing menu → UPDATE
      // --------------------------
      const sTitles = sMenu.items.map((i) => i.title);
      const pTitles = match.items.map((i) => i.title);
      const missing = sTitles.filter((t) => !pTitles.includes(t));

      if (missing.length > 0) {
        const updateMutation = `
          mutation menuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
            menuUpdate(id: $id, title: $title, items: $items) {
              menu { id title handle }
              userErrors { field message }
            }
          }
        `;

        const variables = {
          id: match.id,
          title: sMenu.title,
          items: [
            ...match.items.map((i) => ({
              title: i.title,
              type: i.type,
              url: i.url,
            })),
            ...sMenu.items
              .filter((i) => missing.includes(i.title))
              .map((i) => ({
                title: i.title,
                type: i.type,
                url: i.url,
              })),
          ],
        };

        const result = await shopifyGraphQL(PROD_SHOP, PROD_ACCESS_TOKEN, updateMutation, variables);
        const errors = result.menuUpdate.userErrors;

        if (errors?.length) {
          results.push({
            title: sMenu.title,
            handle: sMenu.handle,
            status: `⚠️ Failed to update: ${errors[0].message}`,
          });
        } else {
          results.push({
            title: sMenu.title,
            handle: sMenu.handle,
            status: `✅ Updated missing items (${missing.join(", ")})`,
          });
        }
      } else {
        results.push({
          title: sMenu.title,
          handle: sMenu.handle,
          status: "✅ No changes needed",
        });
      }
    }

    return json({
      success: true,
      message: "✅ Menu sync completed successfully.",
      results,
    });
  } catch (error) {
    console.error("❌ Menu sync error:", error);
    return json({ success: false, message: error.message });
  }
}
