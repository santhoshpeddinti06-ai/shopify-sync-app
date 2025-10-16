// app/utils/shopify-collections.server.js
import { shopifyApi } from "@shopify/shopify-api";

// ✅ Fetch all custom collections (manual + smart) from a given store
export async function fetchCollectionsFromStore(shop, token) {
  try {
    const client = new shopifyApi.RestClient(shop, token);

    // Fetch manual collections
    const manualRes = await client.get({ path: "custom_collections" });
    const manualCollections = manualRes.body.custom_collections || [];

    // Fetch smart collections
    const smartRes = await client.get({ path: "smart_collections" });
    const smartCollections = smartRes.body.smart_collections || [];

    // Merge both manual and smart collections
    return [...manualCollections, ...smartCollections];
  } catch (err) {
    console.error(`❌ Error fetching collections from ${shop}:`, err);
    return [];
  }
}

// ✅ Push a collection to a store (manual or smart)
export async function pushCollectionToStore(shop, token, collection) {
  try {
    const client = new shopifyApi.RestClient(shop, token);

    const isSmart = collection.rules || collection.ruleset; // smart collection if rules exist
    const data = isSmart
      ? { smart_collection: collection }
      : { custom_collection: collection };

    const path = isSmart ? "smart_collections" : "custom_collections";

    const res = await client.post({
      path,
      data,
      type: "application/json",
    });

    return isSmart ? res.body.smart_collection : res.body.custom_collection;
  } catch (err) {
    console.error(`❌ Error pushing collection "${collection.title}" to ${shop}:`, err);
    throw err;
  }
}
