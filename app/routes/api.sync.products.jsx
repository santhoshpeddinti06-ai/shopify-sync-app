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

    const products = await fetchProductsFromStore(
      process.env.STAGE_SHOP,
      process.env.STAGE_ACCESS_TOKEN
    );

    let syncedCount = 0;
    for (const product of products) {
      await pushProductToStore(process.env.PROD_SHOP, process.env.PROD_ACCESS_TOKEN, product);
      syncedCount++;
    }

    return json({ success: true, syncedCount });
  } catch (err) {
    console.error("Product sync error:", err);
    return json({ error: err.message || "Sync failed" }, { status: 500 });
  }
};
