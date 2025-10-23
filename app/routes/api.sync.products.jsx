// app/routes/api.sync.products.jsx
import { json } from "@remix-run/node";
import {
  fetchProductsFromStore,
  pushProductToStore,
} from "../utils/shopify-products.server.js";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const direction = url.searchParams.get("direction") || "stage-to-prod"; // current sync direction

    // 🔹 Determine source store (based on direction)
    const sourceShop =
      direction === "stage-to-prod" ? process.env.STAGE_SHOP : process.env.PROD_SHOP;
    const sourceToken =
      direction === "stage-to-prod"
        ? process.env.STAGE_ACCESS_TOKEN
        : process.env.PROD_ACCESS_TOKEN;

    const products = await fetchProductsFromStore(sourceShop, sourceToken);

    return json({ products, direction });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    return json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action");
    const direction = formData.get("direction") || "stage-to-prod";

    if (actionType !== "sync") {
      return json({ error: "Invalid action" }, { status: 400 });
    }

    // 🔹 Define source and target based on direction
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

    // 🔹 Fetch products from both stores
    const sourceProducts = await fetchProductsFromStore(sourceShop, sourceToken);
    const targetProducts = await fetchProductsFromStore(targetShop, targetToken);

    if (!Array.isArray(sourceProducts) || !Array.isArray(targetProducts)) {
      throw new Error("Invalid products data fetched from Shopify API");
    }

    // 🔹 Build a map of existing products in target by handle or title
    const targetProductMap = new Map();
    for (const p of targetProducts) {
      const key = p.handle?.toLowerCase() || p.title?.toLowerCase();
      if (key) targetProductMap.set(key, p);
    }

    // 🔹 Find products that are missing in target
    const productsToSync = sourceProducts.filter((p) => {
      const key = p.handle?.toLowerCase() || p.title?.toLowerCase();
      if (!key) return true; // no handle/title → try syncing
      return !targetProductMap.has(key); // only push if not existing
    });

    if (productsToSync.length === 0) {
      return json({
        success: true,
        syncedCount: 0,
        message: "✅ All products are up to date — no missing products to sync.",
        direction,
      });
    }

    let syncedCount = 0;
    const syncedTitles = [];
    const results = [];

    // 🔹 Push missing products safely
    for (const product of productsToSync) {
      try {
        await pushProductToStore(targetShop, targetToken, product);
        syncedCount++;
        syncedTitles.push(product.title);
        results.push({ title: product.title, status: "✅ Synced" });
      } catch (err) {
        console.error(`❌ Failed to sync "${product.title}":`, err);
        results.push({ title: product.title, status: `❌ Failed: ${err.message}` });
      }
    }

    const message = `✅ ${syncedCount} new product${
      syncedCount !== 1 ? "s" : ""
    } synced successfully (${direction === "stage-to-prod" ? "staging → production" : "production → staging"}).`;

    return json({
      success: true,
      syncedCount,
      syncedProducts: syncedTitles,
      results,
      message,
      direction,
    });
  } catch (err) {
    console.error("❌ Product sync error:", err);
    return json({ error: err.message || "Sync failed" }, { status: 500 });
  }
};
