// app/routes/api.sync.products.jsx
import { json } from "@remix-run/node";
import {
  fetchProductsFromStore,
  pushProductToStore,
} from "../utils/shopify-products.server.js";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const direction = url.searchParams.get("direction") || "stage-to-prod"; // 🔹 use direction

    const sourceShop =
      direction === "stage-to-prod" ? process.env.STAGE_SHOP : process.env.PROD_SHOP; // 🔹 source
    const sourceToken =
      direction === "stage-to-prod"
        ? process.env.STAGE_ACCESS_TOKEN
        : process.env.PROD_ACCESS_TOKEN; // 🔹 token

    const products = await fetchProductsFromStore(sourceShop, sourceToken);
    return json({ products, direction }); // 🔹 send direction for frontend display
  } catch (err) {
    console.error("Error fetching products:", err);
    return json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action");
    const direction = formData.get("direction") || "stage-to-prod"; // 🔹 get direction from frontend

    if (actionType !== "sync") {
      return json({ error: "Invalid action" }, { status: 400 });
    }

    // 🔹 Decide source and target based on direction
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

    // Fetch products from source and target
    const sourceProducts = await fetchProductsFromStore(sourceShop, sourceToken);
    const targetProducts = await fetchProductsFromStore(targetShop, targetToken);

    // 🔹 Build set of existing identifiers (handle + SKU) to avoid duplicates
    const existingIdentifiers = new Set();
    targetProducts.forEach((p) => {
      if (p.handle) existingIdentifiers.add(p.handle);
      p.variants?.forEach((v) => {
        if (v.sku) existingIdentifiers.add(v.sku);
      });
    });

    // 🔹 Filter only new products that do not exist in target
    const newProducts = sourceProducts.filter((p) => {
      if (existingIdentifiers.has(p.handle)) return false;
      if (p.variants?.some((v) => v.sku && existingIdentifiers.has(v.sku))) return false;
      return true;
    });

    if (!newProducts.length) {
      return json({
        success: true,
        syncedCount: 0,
        message: `✅ All products are up to date — no new products to sync.`,
        direction,
      });
    }

    let syncedCount = 0;
    const syncedTitles = [];
    const results = [];

    for (const product of newProducts) {
      try {
        await pushProductToStore(targetShop, targetToken, product);
        syncedCount++;
        syncedTitles.push(product.title);
        results.push({
          title: product.title,
          status: "✅ Synced",
        });
      } catch (err) {
        console.error(`❌ Failed to push "${product.title}":`, err);
        results.push({
          title: product.title,
          status: `❌ Failed: ${err.message}`,
        });
      }
    }

    return json({
      success: true,
      syncedCount,
      syncedProducts: syncedTitles,
      message: `✅ ${syncedCount} new product${syncedCount > 1 ? "s" : ""} synced successfully`,
      results,
      direction, // 🔹 send current direction for frontend display
    });
  } catch (err) {
    console.error("❌ Product sync error:", err);
    return json({ error: err.message || "Sync failed" }, { status: 500 });
  }
};
