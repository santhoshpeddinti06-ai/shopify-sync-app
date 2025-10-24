import { json } from "@remix-run/node";

const { STAGE_SHOP, STAGE_ACCESS_TOKEN, PROD_SHOP, PROD_ACCESS_TOKEN } = process.env;

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

// Fetch products with tags
async function fetchProducts(shop, token) {
  const query = `
    {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            tags
          }
        }
      }
    }
  `;
  const data = await shopifyGraphQL(shop, token, query);
  return data.products.edges.map(e => e.node);
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const direction = url.searchParams.get("direction") || "stage-to-prod";

    const sourceShop = direction === "stage-to-prod" ? STAGE_SHOP : PROD_SHOP;
    const sourceToken = direction === "stage-to-prod" ? STAGE_ACCESS_TOKEN : PROD_ACCESS_TOKEN;

    const targetShop = direction === "stage-to-prod" ? PROD_SHOP : STAGE_SHOP;
    const targetToken = direction === "stage-to-prod" ? PROD_ACCESS_TOKEN : STAGE_ACCESS_TOKEN;

    const [sourceProducts, targetProducts] = await Promise.all([
      fetchProducts(sourceShop, sourceToken),
      fetchProducts(targetShop, targetToken),
    ]);

    const results = sourceProducts.map(s => {
      const t = targetProducts.find(p => p.handle === s.handle);
      if (!t) return { title: s.title, handle: s.handle, status: "⚠️ Missing in target store" };
      const match = s.tags.join(",") === t.tags.join(",");
      return { title: s.title, handle: s.handle, status: match ? "✅ Tags match" : "⚠️ Tags differ" };
    });

    return json({
      success: true,
      message: `✅ Tag preview completed (${direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"})`,
      results,
      matched: results.filter(r => r.status === "✅ Tags match").length,
      updatedCount: 0,
      failed: 0,
    });
  } catch (error) {
    return json({ success: false, message: error.message });
  }
}

export async function action({ request }) {
  try {
    const formData = await request.formData();
    const direction = formData.get("direction") || "stage-to-prod";

    const sourceShop = direction === "stage-to-prod" ? STAGE_SHOP : PROD_SHOP;
    const sourceToken = direction === "stage-to-prod" ? STAGE_ACCESS_TOKEN : PROD_ACCESS_TOKEN;

    const targetShop = direction === "stage-to-prod" ? PROD_SHOP : STAGE_SHOP;
    const targetToken = direction === "stage-to-prod" ? PROD_ACCESS_TOKEN : STAGE_ACCESS_TOKEN;

    const [sourceProducts, targetProducts] = await Promise.all([
      fetchProducts(sourceShop, sourceToken),
      fetchProducts(targetShop, targetToken),
    ]);

    let updatedCount = 0;
    const results = [];

    for (const s of sourceProducts) {
      const t = targetProducts.find(p => p.handle === s.handle);
      if (!t) {
        results.push({ title: s.title, handle: s.handle, status: "⚠️ Missing in target store" });
        continue;
      }

      const match = s.tags.join(",") === t.tags.join(",");
      if (match) {
        results.push({ title: s.title, handle: s.handle, status: "✅ Tags match" });
      } else {
        // Push tags to target store
        const mutation = `
          mutation productUpdate($id: ID!, $tags: [String!]!) {
            productUpdate(input: { id: $id, tags: $tags }) {
              product { id tags }
              userErrors { field message }
            }
          }
        `;
        const variables = { id: t.id, tags: s.tags };
        const response = await shopifyGraphQL(targetShop, targetToken, mutation, variables);
        const errors = response.productUpdate.userErrors;
        if (errors.length > 0) {
          results.push({ title: s.title, handle: s.handle, status: `❌ Failed: ${errors[0].message}` });
        } else {
          results.push({ title: s.title, handle: s.handle, status: "✅ Pushed to target store" });
          updatedCount++;
        }
      }
    }

    return json({
      success: true,
      message: `✅ Tag sync completed (${direction === "stage-to-prod" ? "Staging → Production" : "Production → Staging"})`,
      results,
      matched: results.filter(r => r.status === "✅ Tags match").length,
      updatedCount,
      failed: results.filter(r => r.status.startsWith("❌")).length,
    });
  } catch (error) {
    return json({ success: false, message: error.message });
  }
}
