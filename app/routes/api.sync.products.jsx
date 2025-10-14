// app/routes/api.sync.products.jsx
import { json } from "@remix-run/node";
import { shopifyGraphQLClient } from "../utils/shopify.server.js";

// ✅ GET: Fetch products from staging
export const loader = async () => {
  try {
    const storeDomain = process.env.STAGE_SHOP;
    const accessToken = process.env.STAGE_ACCESS_TOKEN;

    if (!storeDomain || !accessToken) {
      return json({ error: "Missing staging store credentials" }, { status: 400 });
    }

    const client = shopifyGraphQLClient(`https://${storeDomain}`, accessToken);

    const query = `
      {
        products(first: 20) {
          edges {
            node {
              id
              title
              handle
              status
              createdAt
              updatedAt
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query({ data: query });
    const products = response?.body?.data?.products?.edges?.map((p) => p.node) || [];

    return json({ success: true, products });
  } catch (err) {
    console.error("Product sync error:", err);
    return json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
};

// ✅ POST: Handle syncing (placeholder)
export const action = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body?.action || body.action !== "sync") {
      return json({ error: "Invalid or missing action" }, { status: 400 });
    }

    // 🔧 Here you can later add your logic to sync products from staging → production
    console.log("Syncing products from staging → production...");

    // For now just simulate a success response
    return json({ success: true, syncedCount: 10 });
  } catch (err) {
    console.error("Product sync POST error:", err);
    return json({ error: err.message || "Failed to sync products" }, { status: 500 });
  }
};
