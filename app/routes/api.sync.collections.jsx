// app/routes/api.sync.collections.jsx
import { json } from "@remix-run/node";
import {
  fetchManualCollectionsFromStore,
  fetchSmartCollectionsFromStore,
  pushCollectionToStore,
} from "../utils/shopify-collections.server.js"; // server-only import, safe in loader/action

export const loader = async () => {
  return json({ message: "Use POST to sync collections" });
};

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action");

    if (actionType !== "sync") {
      return json({ error: "Invalid action" }, { status: 400 });
    }

    // ✅ Fetch manual and smart collections from staging
    const stagingManual = await fetchManualCollectionsFromStore(
      process.env.STAGE_SHOP,
      process.env.STAGE_ACCESS_TOKEN
    );
    const stagingSmart = await fetchSmartCollectionsFromStore(
      process.env.STAGE_SHOP,
      process.env.STAGE_ACCESS_TOKEN
    );

    const stagingCollections = [...stagingManual, ...stagingSmart];

    // ✅ Fetch manual and smart collections from production
    const productionManual = await fetchManualCollectionsFromStore(
      process.env.PROD_SHOP,
      process.env.PROD_ACCESS_TOKEN
    );
    const productionSmart = await fetchSmartCollectionsFromStore(
      process.env.PROD_SHOP,
      process.env.PROD_ACCESS_TOKEN
    );

    const productionCollections = [...productionManual, ...productionSmart];

    // Build a set of existing handles/titles (case-insensitive)
    const existingHandles = new Set(
      (productionCollections || []).map(
        (c) => (c.handle || c.title || "").trim().toLowerCase()
      )
    );

    // Filter only new collections
    const newCollections = (stagingCollections || []).filter(
      (c) => !existingHandles.has((c.handle || c.title || "").trim().toLowerCase())
    );

    if (!newCollections.length) {
      return json({
        success: true,
        syncedCount: 0,
        message: "✅ No new collections to sync — all are up to date.",
      });
    }

    let syncedCount = 0;
    const syncedTitles = [];

    for (const collection of newCollections) {
      try {
        // Only custom collections can be pushed via REST API
        if (collection.id && collection.title && collection.handle) {
          await pushCollectionToStore(
            process.env.PROD_SHOP,
            process.env.PROD_ACCESS_TOKEN,
            collection
          );
          syncedCount++;
          syncedTitles.push(collection.title);
        }
      } catch (err) {
        console.error(`❌ Failed to push collection "${collection.title}":`, err);
      }
    }

    return json({
      success: true,
      syncedCount,
      syncedCollections: syncedTitles,
      message: `✅ ${syncedCount} new collection(s) synced successfully!`,
    });
  } catch (err) {
    console.error("❌ Collection sync error:", err);
    return json({ error: err.message || "Sync failed" }, { status: 500 });
  }
};
