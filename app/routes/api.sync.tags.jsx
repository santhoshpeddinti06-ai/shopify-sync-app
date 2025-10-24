// app/routes/api.sync.tags.jsx
import { json } from "@remix-run/node";

/**
 * Simple REST helpers to fetch and update products.
 * NOTE: This uses a single-page REST fetch (limit=250). If your store has
 * >250 products implement pagination (since_id or GraphQL).
 */

const API_VERSION = "2025-10";

async function fetchProductsRest(shop, token) {
  const url = `https://${shop}/admin/api/${API_VERSION}/products.json?limit=250&fields=id,handle,title,tags`;
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch products from ${shop}: ${text}`);
  }
  const data = await res.json();
  return (data.products || []).map((p) => ({
    id: p.id,
    handle: p.handle,
    title: p.title,
    tags: typeof p.tags === "string" ? p.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
  }));
}

async function updateProductTags(shop, token, productId, tagsArray) {
  const url = `https://${shop}/admin/api/${API_VERSION}/products/${productId}.json`;
  const body = { product: { id: productId, tags: tagsArray.join(", ") } };
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// ----------------- Loader -----------------
// GET /api/sync/tags?direction=stage-to-prod  (or prod-to-stage)
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const direction = url.searchParams.get("direction") || "stage-to-prod";

    const sourceShop = direction === "stage-to-prod" ? process.env.STAGE_SHOP : process.env.PROD_SHOP;
    const sourceToken = direction === "stage-to-prod" ? process.env.STAGE_ACCESS_TOKEN : process.env.PROD_ACCESS_TOKEN;

    if (!sourceShop || !sourceToken) {
      return json({ success: false, message: "Missing .env values for source store." });
    }

    const sourceProducts = await fetchProductsRest(sourceShop, sourceToken);
    return json({ success: true, products: sourceProducts, direction });
  } catch (err) {
    console.error("❌ Tags loader error:", err);
    return json({ success: false, message: err.message || "Failed to fetch products." });
  }
};

// ----------------- Action -----------------
// POST form with action=sync and direction=stage-to-prod | prod-to-stage
export const action = async ({ request }) => {
  try {
    const form = await request.formData();
    const actionType = form.get("action");
    const direction = form.get("direction") || "stage-to-prod";

    if (actionType !== "sync") {
      return json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const sourceShop = direction === "stage-to-prod" ? process.env.STAGE_SHOP : process.env.PROD_SHOP;
    const sourceToken = direction === "stage-to-prod" ? process.env.STAGE_ACCESS_TOKEN : process.env.PROD_ACCESS_TOKEN;

    const targetShop = direction === "stage-to-prod" ? process.env.PROD_SHOP : process.env.STAGE_SHOP;
    const targetToken = direction === "stage-to-prod" ? process.env.PROD_ACCESS_TOKEN : process.env.STAGE_ACCESS_TOKEN;

    if (!sourceShop || !sourceToken || !targetShop || !targetToken) {
      return json({ success: false, message: "Missing .env values for source/target." });
    }

    // Fetch products from both stores (single page)
    const [sourceProducts, targetProducts] = await Promise.all([
      fetchProductsRest(sourceShop, sourceToken),
      fetchProductsRest(targetShop, targetToken),
    ]);

    // Map target products by handle (fallback to title)
    const targetMap = new Map(targetProducts.map(p => [p.handle || p.title, p]));

    const results = [];
    let updatedCount = 0;

    for (const s of sourceProducts) {
      const key = s.handle || s.title;
      const target = targetMap.get(key);

      if (!target) {
        results.push({ title: s.title, handle: s.handle, status: "❌ Missing in target" });
        continue;
      }

      // Compare tags (case-insensitive)
      const sourceTags = (s.tags || []).map(t => t.trim()).filter(Boolean);
      const targetTags = (target.tags || []).map(t => t.trim()).filter(Boolean);

      const same =
        sourceTags.length === targetTags.length &&
        sourceTags.every(st => targetTags.some(tt => tt.toLowerCase() === st.toLowerCase()));

      if (same) {
        results.push({ title: s.title, handle: s.handle, status: "✅ Tags match" });
        continue;
      }

      // Update target product tags
      try {
        const updateRes = await updateProductTags(targetShop, targetToken, target.id, sourceTags);
        if (updateRes.ok) {
          updatedCount++;
          results.push({ title: s.title, handle: s.handle, status: `✅ Updated tags (${sourceTags.join(", ")})` });
        } else {
          results.push({ title: s.title, handle: s.handle, status: `⚠️ Failed to update: ${JSON.stringify(updateRes.data)}` });
        }
      } catch (err) {
        console.error("Error updating tags:", err);
        results.push({ title: s.title, handle: s.handle, status: `❌ Error: ${err.message}` });
      }
    }

    return json({
      success: true,
      message: `✅ Tag sync completed (${direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"})`,
      updatedCount,
      results,
      direction,
    });
  } catch (err) {
    console.error("❌ Tags action error:", err);
    return json({ success: false, message: err.message || "Sync failed" }, { status: 500 });
  }
};
