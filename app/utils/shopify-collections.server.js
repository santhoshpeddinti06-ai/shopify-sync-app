// app/utils/shopify-collections.server.js
//
// Small, dependency-free helpers that use Shopify Admin REST endpoints via fetch.
// Supports both manual (custom_collections) and smart (smart_collections).

/**
 * Generic fetch helper for collections
 * @param {string} shop - myshopify domain (e.g. santosh-dev.myshopify.com)
 * @param {string} token - Admin API access token
 * @param {"custom"|"smart"} type - which collection endpoint
 * @returns {Array} array of collections
 */
async function fetchCollections(shop, token, type = "custom") {
  // custom => custom_collections.json
  // smart  => smart_collections.json
  const url =
    type === "custom"
      ? `https://${shop}/admin/api/2025-10/custom_collections.json`
      : `https://${shop}/admin/api/2025-10/smart_collections.json`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    // If non-200, return empty array (caller can log)
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(`fetchCollections ${type} failed for ${shop}: ${res.status} ${txt}`);
      return [];
    }

    const data = await res.json();
    return type === "custom" ? data.custom_collections || [] : data.smart_collections || [];
  } catch (err) {
    console.error(`❌ Error fetching ${type} collections from ${shop}:`, err);
    return [];
  }
}

/**
 * Push (create) a manual (custom) collection in destination store.
 * Returns the created custom_collection object from Shopify.
 */
export async function pushManualCollectionToStore(shop, token, collection) {
  const url = `https://${shop}/admin/api/2025-10/custom_collections.json`;
  const body = {
    custom_collection: {
      title: collection.title,
      handle: collection.handle,
      body_html: collection.body_html || "",
      image: collection.image || null,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Push manual collection failed: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data.custom_collection;
  } catch (err) {
    console.error(`❌ Error pushing manual collection "${collection.title}" to ${shop}:`, err);
    throw err;
  }
}

/**
 * Push (create) a smart (automated) collection in destination store.
 * Use the smart_collections endpoint with rules and disjunctive flag.
 * Returns the created smart_collection object from Shopify.
 */
export async function pushSmartCollectionToStore(shop, token, collection) {
  const url = `https://${shop}/admin/api/2025-10/smart_collections.json`;
  // collection coming from staging will have .rules (array) and maybe .disjunctive
  const body = {
    smart_collection: {
      title: collection.title,
      handle: collection.handle,
      rules: collection.rules || [],
      disjunctive: collection.disjunctive || false,
      body_html: collection.body_html || "",
      image: collection.image || null,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Push smart collection failed: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data.smart_collection;
  } catch (err) {
    console.error(`❌ Error pushing smart collection "${collection.title}" to ${shop}:`, err);
    throw err;
  }
}

/**
 * Exported helpers — small wrappers for clarity.
 */
export const fetchManualCollectionsFromStore = (shop, token) =>
  fetchCollections(shop, token, "custom");

export const fetchSmartCollectionsFromStore = (shop, token) =>
  fetchCollections(shop, token, "smart");

/**
 * Convenience: fetch both manual + smart and return combined array (manual first).
 * Note: caller may want to treat manual/smart differently; use specific functions if needed.
 */
export async function fetchAllCollectionsFromStore(shop, token) {
  const [manual, smart] = await Promise.all([
    fetchManualCollectionsFromStore(shop, token),
    fetchSmartCollectionsFromStore(shop, token),
  ]);
  return [...manual, ...smart];
}

/**
 * Convenience: push collection (delegates to manual or smart push)
 */
export async function pushCollectionToStore(shop, token, collection) {
  // If collection has rules array -> treat as smart, otherwise manual
  if (collection.rules && Array.isArray(collection.rules) && collection.rules.length > 0) {
    return pushSmartCollectionToStore(shop, token, collection);
  } else {
    return pushManualCollectionToStore(shop, token, collection);
  }
}
