// app/routes/api.sync.menus.jsx
import { json } from "@remix-run/node";

export async function action() {
  const stageShop = process.env.STAGE_SHOP;
  const stageToken = process.env.STAGE_ACCESS_TOKEN;
  const prodShop = process.env.PROD_SHOP;
  const prodToken = process.env.PROD_ACCESS_TOKEN;

  try {
    console.log("🔹 Fetching menus from staging store:", stageShop);

    // ✅ STEP 1: Fetch menus from staging
    const stageResponse = await fetch(`https://${stageShop}/admin/api/2025-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": stageToken,
      },
      body: JSON.stringify({
        query: `
          {
            menus(first: 50) {
              edges {
                node {
                  id
                  title
                  handle
                  items {
                    title
                    url
                  }
                }
              }
            }
          }
        `,
      }),
    });

    const stageData = await stageResponse.json();
    const menus = stageData?.data?.menus?.edges || [];

    console.log(`✅ Found ${menus.length} menu(s) in staging.`);

    if (menus.length === 0) {
      return json({ success: false, message: "No menus found in staging store." });
    }

    // ✅ STEP 2: Push menus to production
    for (const { node: menu } of menus) {
      console.log(`➡️ Creating menu "${menu.title}" in production...`);

      const createMenuRes = await fetch(`https://${prodShop}/admin/api/2025-10/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": prodToken,
        },
        body: JSON.stringify({
          query: `
            mutation menuCreate($title: String!, $handle: String!) {
              menuCreate(title: $title, handle: $handle) {
                menu { id title }
                userErrors { field message }
              }
            }
          `,
          variables: { title: menu.title, handle: menu.handle },
        }),
      });

      const createMenuData = await createMenuRes.json();
      const newMenuId = createMenuData?.data?.menuCreate?.menu?.id;
      const menuErrors = createMenuData?.data?.menuCreate?.userErrors || [];

      if (!newMenuId || menuErrors.length > 0) {
        console.error(`❌ Menu create failed for "${menu.title}"`, menuErrors);
        continue;
      }

      console.log(`✅ Menu created: ${menu.title} (${newMenuId})`);

      // ✅ STEP 3: Add menu items
      for (const item of menu.items) {
        console.log(`   ➕ Adding item "${item.title}" -> ${item.url}`);

        const itemRes = await fetch(`https://${prodShop}/admin/api/2025-10/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": prodToken,
          },
          body: JSON.stringify({
            query: `
              mutation menuItemCreate($menuId: ID!, $title: String!, $url: String!) {
                menuItemCreate(menuId: $menuId, title: $title, url: $url) {
                  menuItem { id }
                  userErrors { field message }
                }
              }
            `,
            variables: {
              menuId: newMenuId,
              title: item.title,
              url: item.url,
            },
          }),
        });

        const itemData = await itemRes.json();
        const itemErrors = itemData?.data?.menuItemCreate?.userErrors || [];
        if (itemErrors.length > 0) {
          console.error(`❌ Error adding item "${item.title}"`, itemErrors);
        } else {
          console.log(`✅ Added item "${item.title}"`);
        }
      }
    }

    console.log("🎉 Menu sync completed successfully!");
    return json({ success: true, message: "✅ Menus synced successfully!" });
  } catch (err) {
    console.error("🚨 Menu sync error:", err);
    return json({ success: false, message: err.message });
  }
}
