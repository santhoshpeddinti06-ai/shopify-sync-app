// app/routes/api.sync.collections.jsx
import { json } from "@remix-run/node";
import {
  fetchManualCollectionsFromStore,
  fetchSmartCollectionsFromStore,
  pushCollectionToStore,
} from "../utils/shopify-collections.server.js";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const direction = url.searchParams.get("direction") || "stage-to-prod"; // bi-directional support

    const sourceShop =
      direction === "stage-to-prod" ? process.env.STAGE_SHOP : process.env.PROD_SHOP;
    const sourceToken =
      direction === "stage-to-prod"
        ? process.env.STAGE_ACCESS_TOKEN
        : process.env.PROD_ACCESS_TOKEN;

    // Fetch all collections (manual + smart)
    const manualCollections = await fetchManualCollectionsFromStore(sourceShop, sourceToken);
    const smartCollections = await fetchSmartCollectionsFromStore(sourceShop, sourceToken);
    const allCollections = [...manualCollections, ...smartCollections];

    return json({ collections: allCollections, direction });
  } catch (err) {
    console.error("❌ Error fetching collections:", err);
    return json({ error: err.message || "Failed to fetch collections" }, { status: 500 });
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

    // Decide source and target based on direction
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

    // Fetch source & target collections
    const sourceManual = await fetchManualCollectionsFromStore(sourceShop, sourceToken);
    const sourceSmart = await fetchSmartCollectionsFromStore(sourceShop, sourceToken);
    const targetManual = await fetchManualCollectionsFromStore(targetShop, targetToken);
    const targetSmart = await fetchSmartCollectionsFromStore(targetShop, targetToken);

    const sourceCollections = [...sourceManual, ...sourceSmart];
    const targetCollections = [...targetManual, ...targetSmart];

    // Build set of existing handles
    const existingHandles = new Set(
      (targetCollections || []).map((c) =>
        (c.handle || c.title || "").trim().toLowerCase()
      )
    );

    // Filter only new collections that don’t exist in target
    const newCollections = (sourceCollections || []).filter(
      (c) => !existingHandles.has((c.handle || c.title || "").trim().toLowerCase())
    );

    if (!newCollections.length) {
      return json({
        success: true,
        syncedCount: 0,
        message: `✅ No new collections to sync — all are up to date.`,
        direction,
      });
    }

    let syncedCount = 0;
    const syncedTitles = [];

    for (const collection of newCollections) {
      try {
        if (collection.id && collection.title && collection.handle) {
          await pushCollectionToStore(targetShop, targetToken, collection);
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
      direction,
    });
  } catch (err) {
    console.error("❌ Collection sync error:", err);
    return json({ error: err.message || "Sync failed" }, { status: 500 });
  }
};
