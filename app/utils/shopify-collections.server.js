// app/utils/shopify-collections.server.js

/**
 * Helper to fetch collections from a Shopify store via REST API.
 * @param {string} shop - store domain
 * @param {string} token - store access token
 * @param {"custom"|"smart"} type - collection type
 * @returns {Array} collections
 */
async function fetchCollections(shop, token, type = "custom") {
  const url =
    type === "custom"
      ? `https://${shop}/admin/api/2025-10/custom_collections.json`
      : `https://${shop}/admin/api/2025-10/smart_collections.json`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return type === "custom"
      ? data.custom_collections || []
      : data.smart_collections || [];
  } catch (err) {
    console.error(`❌ Error fetching ${type} collections from ${shop}:`, err);
    return [];
  }
}

/**
 * Push a manual (custom) collection to a store
 */
export async function pushCollectionToStore(shop, token, collection) {
  try {
    const url = `https://${shop}/admin/api/2025-10/custom_collections.json`;
    const body = {
      custom_collection: {
        title: collection.title,
        handle: collection.handle,
        body_html: collection.body_html || "",
        image: collection.image || null,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.custom_collection;
  } catch (err) {
    console.error(`❌ Error pushing collection "${collection.title}" to ${shop}:`, err);
    throw err;
  }
}

// ✅ Export server-only helpers
export const fetchManualCollectionsFromStore = (shop, token) =>
  fetchCollections(shop, token, "custom");

export const fetchSmartCollectionsFromStore = (shop, token) =>
  fetchCollections(shop, token, "smart");
