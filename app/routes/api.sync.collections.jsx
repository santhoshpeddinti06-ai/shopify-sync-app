// app/routes/api.sync.collections.jsx
import { json } from "@remix-run/node";
import {
  fetchManualCollectionsFromStore,
  fetchSmartCollectionsFromStore,
  pushManualCollectionToStore,
  pushSmartCollectionToStore,
  fetchAllCollectionsFromStore,
} from "../utils/shopify-collections.server.js";

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

    // NOTE: We call specific fetchers so we can classify manual vs smart separately.
    const stagingManual = await fetchManualCollectionsFromStore(
      process.env.STAGE_SHOP,
      process.env.STAGE_ACCESS_TOKEN
    );
    const stagingSmart = await fetchSmartCollectionsFromStore(
      process.env.STAGE_SHOP,
      process.env.STAGE_ACCESS_TOKEN
    );

    // Fetch production manual + smart so we avoid duplicates across both types
    const prodManual = await fetchManualCollectionsFromStore(
      process.env.PROD_SHOP,
      process.env.PROD_ACCESS_TOKEN
    );
    const prodSmart = await fetchSmartCollectionsFromStore(
      process.env.PROD_SHOP,
      process.env.PROD_ACCESS_TOKEN
    );

    // Build a set of handles/titles already in production (case-insensitive)
    const existingHandles = new Set(
      [...(prodManual || []), ...(prodSmart || [])].map((c) =>
        (c.handle || c.title || "").trim().toLowerCase()
      )
    );

    // Filter staging manual & smart to only items NOT present in production
    const newManual = (stagingManual || []).filter(
      (c) => !existingHandles.has((c.handle || c.title || "").trim().toLowerCase())
    );
    const newSmart = (stagingSmart || []).filter(
      (c) => !existingHandles.has((c.handle || c.title || "").trim().toLowerCase())
    );

    // If nothing to sync, return early with message
    if (!newManual.length && !newSmart.length) {
      return json({
        success: true,
        syncedCount: 0,
        message: "✅ No new collections to sync — all are up to date.",
      });
    }

    // Push manual + smart collections separately and collect names for response
    const syncedManual = [];
    const syncedSmart = [];
    let syncedCount = 0;

    for (const c of newManual) {
      try {
        await pushManualCollectionToStore(
          process.env.PROD_SHOP,
          process.env.PROD_ACCESS_TOKEN,
          c
        );
        syncedManual.push(c.title);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to push manual collection "${c.title}":`, err);
      }
    }

    for (const c of newSmart) {
      try {
        await pushSmartCollectionToStore(
          process.env.PROD_SHOP,
          process.env.PROD_ACCESS_TOKEN,
          c
        );
        syncedSmart.push(c.title);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to push smart collection "${c.title}":`, err);
      }
    }

    const message = syncedCount
      ? `✅ ${syncedCount} new collection(s) synced successfully!`
      : "✅ No new collections were synced.";

    console.log(message, { syncedManual, syncedSmart });

    return json({
      success: true,
      syncedCount,
      syncedManual,
      syncedSmart,
      message,
    });
  } catch (err) {
    console.error("❌ Collection sync error:", err);
    return json({ error: err.message || "Sync failed" }, { status: 500 });
  }
};
