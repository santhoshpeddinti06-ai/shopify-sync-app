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

// Fetch menus and items
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
  return data.menus.edges.map(e => e.node);
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
    const [stagingMenus, prodMenus] = await Promise.all([
      fetchMenus(STAGE_SHOP, STAGE_ACCESS_TOKEN),
      fetchMenus(PROD_SHOP, PROD_ACCESS_TOKEN),
    ]);

    const results = [];

    for (const sMenu of stagingMenus) {
      const match = prodMenus.find(m => m.handle === sMenu.handle);

      // ----------------- CREATE menu if missing -----------------
      if (!match) {
        const createMutation = `
          mutation menuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
            menuCreate(title: $title, handle: $handle, items: $items) {
              menu { id title handle items { id title url } }
              userErrors { field message }
            }
          }
        `;
        const variables = {
          title: sMenu.title,
          handle: sMenu.handle,
          items: sMenu.items.map(i => ({ title: i.title, type: i.type, url: i.url })),
        };

        const result = await shopifyGraphQL(PROD_SHOP, PROD_ACCESS_TOKEN, createMutation, variables);
        const errors = result.menuCreate.userErrors;

        results.push({
          title: sMenu.title,
          handle: sMenu.handle,
          status: errors.length ? `⚠️ Failed to create: ${errors[0].message}` : "✅ Created with items",
        });
        continue;
      }

      // ----------------- UPDATE existing menu items -----------------
      const missingItems = sMenu.items.filter(
        i => !match.items.some(p => p.title === i.title)
      );

      if (missingItems.length > 0) {
        const updateMutation = `
          mutation menuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
            menuUpdate(id: $id, title: $title, items: $items) {
              menu { id title handle items { id title url } }
              userErrors { field message }
            }
          }
        `;
        const variables = {
          id: match.id,
          title: sMenu.title,
          items: [
            ...match.items.map(i => ({ id: i.id, title: i.title, url: i.url, type: i.type })),
            ...missingItems.map(i => ({ title: i.title, url: i.url, type: i.type })),
          ],
        };

        const result = await shopifyGraphQL(PROD_SHOP, PROD_ACCESS_TOKEN, updateMutation, variables);
        const errors = result.menuUpdate.userErrors;

        results.push({
          title: sMenu.title,
          handle: sMenu.handle,
          status: errors.length
            ? `⚠️ Failed to update: ${errors[0].message}`
            : `✅ Updated missing items (${missingItems.map(i => i.title).join(", ")})`,
        });
      } else {
        results.push({ title: sMenu.title, handle: sMenu.handle, status: "✅ No changes needed" });
      }
    }

    return json({
      success: true,
      message: "✅ Menus and menu items synced successfully.",
      results,
    });
  } catch (error) {
    console.error("❌ Menu sync error:", error);
    return json({ success: false, message: error.message });
  }
}
