// app/routes/api.sync.menus.jsx
import { json } from "@remix-run/node";

// Shopify GraphQL helper
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

// Fetch menus from a store
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

// ----------------- Loader -----------------
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const direction = url.searchParams.get("direction") || "stage-to-prod";

    const sourceShop =
      direction === "stage-to-prod" ? process.env.STAGE_SHOP : process.env.PROD_SHOP;
    const sourceToken =
      direction === "stage-to-prod"
        ? process.env.STAGE_ACCESS_TOKEN
        : process.env.PROD_ACCESS_TOKEN;

    const menus = await fetchMenus(sourceShop, sourceToken);
    return json({ menus, direction });
  } catch (error) {
    console.error("❌ Error fetching menus:", error);
    return json({ error: error.message || "Failed to fetch menus" }, { status: 500 });
  }
};

// ----------------- Action -----------------
export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action");
    const direction = formData.get("direction") || "stage-to-prod";

    if (actionType !== "sync") {
      return json({ error: "Invalid action" }, { status: 400 });
    }

    const sourceShop =
      direction === "stage-to-prod" ? process.env.STAGE_SHOP : process.env.PROD_SHOP;
    const sourceToken =
      direction === "stage-to-prod"
        ? process.env.STAGE_ACCESS_TOKEN
        : process.env.PROD_ACCESS_TOKEN;

    const targetShop =
      direction === "stage-to-prod" ? process.env.PROD_SHOP : process.env.STAGE_SHOP;
    const targetToken =
      direction === "stage-to-prod"
        ? process.env.PROD_ACCESS_TOKEN
        : process.env.STAGE_ACCESS_TOKEN;

    const [sourceMenus, targetMenus] = await Promise.all([
      fetchMenus(sourceShop, sourceToken),
      fetchMenus(targetShop, targetToken),
    ]);

    const results = [];

    for (const sMenu of sourceMenus) {
      const match = targetMenus.find(m => m.handle === sMenu.handle);

      // CREATE menu if missing
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
        const result = await shopifyGraphQL(targetShop, targetToken, createMutation, variables);
        const errors = result.menuCreate.userErrors;

        results.push({
          title: sMenu.title,
          handle: sMenu.handle,
          status: errors.length ? `⚠️ Failed to create: ${errors[0].message}` : "✅ Created",
        });
        continue;
      }

      // UPDATE missing items
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
        const result = await shopifyGraphQL(targetShop, targetToken, updateMutation, variables);
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
      results,
      direction,
      message: `✅ Menus synced successfully (${direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"})`,
    });
  } catch (error) {
    console.error("❌ Menu sync error:", error);
    return json({ success: false, message: error.message });
  }
};
