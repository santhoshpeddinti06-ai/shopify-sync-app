// app/routes/api.sync.products.jsx
import { json } from "@remix-run/node";
import {
  fetchProductsFromStore,
  pushProductToStore,
} from "../utils/shopify-products.server.js";

export const loader = async () => {
  try {
    const products = await fetchProductsFromStore(
      process.env.STAGE_SHOP,
      process.env.STAGE_ACCESS_TOKEN
    );
    return json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    return json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action");

    if (actionType !== "sync") {
      return json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch products from staging and production
    const stagingProducts = await fetchProductsFromStore(
      process.env.STAGE_SHOP,
      process.env.STAGE_ACCESS_TOKEN
    );
    const productionProducts = await fetchProductsFromStore(
      process.env.PROD_SHOP,
      process.env.PROD_ACCESS_TOKEN
    );

    // Build a set of existing handles (or titles)
    const existingHandles = new Set(
      (productionProducts || []).map((p) => (p.handle ? p.handle : p.title))
    );

    // Filter only new products
    const newProducts = (stagingProducts || []).filter(
      (p) => !existingHandles.has(p.handle ? p.handle : p.title)
    );

    if (!newProducts.length) {
      return json({
        success: true,
        syncedCount: 0,
        message: "✅ All products are up to date — no new products to sync.",
      });
    }

    // Sync only new products
    let syncedCount = 0;
    const syncedTitles = [];

    for (const product of newProducts) {
      try {
        await pushProductToStore(
          process.env.PROD_SHOP,
          process.env.PROD_ACCESS_TOKEN,
          product
        );
        syncedCount++;
        syncedTitles.push(product.title);
      } catch (pushErr) {
        console.error(`❌ Failed to push "${product.title}":`, pushErr);
      }
    }

    // Build readable message for frontend
    const syncedList = syncedTitles.join(", ");
    const message = `✅ ${syncedCount} new product${
      syncedCount > 1 ? "s" : ""
    } synced successfully: ${syncedList}`;

    console.log(message);

    return json({
      success: true,
      syncedCount,
      syncedProducts: syncedTitles,
      message,
    });
  } catch (err) {
    console.error("❌ Product sync error:", err);
    return json({ error: err.message || "Sync failed" }, { status: 500 });
  }
};
