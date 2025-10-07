import { json } from "@remix-run/node";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// 🧩 Load access tokens from environment
const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;
const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;

console.log("🔐 PROD_ACCESS_TOKEN loaded:", !!PROD_ACCESS_TOKEN);
console.log("🔐 STAGE_ACCESS_TOKEN loaded:", !!STAGE_ACCESS_TOKEN);

// 🧠 GraphQL query to fetch basic shop settings
const SHOP_SETTINGS_QUERY = `
query {
  shop {
    name
    email
    myshopifyDomain
    currencyCode
    weightUnit
    taxesIncluded
    timezoneAbbreviation
  }
}
`;

// 🧩 Helper to call Shopify GraphQL API
async function callShopifyGraphQL(storeDomain, token, query) {
  try {
    const res = await fetch(`https://${storeDomain}/admin/api/2025-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();

    // Log response for debugging
    console.log(`🔍 Response from ${storeDomain}:`, JSON.stringify(data, null, 2));

    // Handle GraphQL errors
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Shopify GraphQL error: ${data.errors[0].message}`);
    }

    if (!res.ok || !data.data) {
      throw new Error(`Shopify returned status ${res.status}`);
    }

    return { data: data.data };
  } catch (err) {
    console.error(`❌ Error calling Shopify (${storeDomain}):`, err.message);
    return { error: err.message };
  }
}

export async function action({ request }) {
  try {
    const body = await request.json();
    const prodDomain = body.prodDomain;
    const stageDomain = body.stageDomain;

    if (!prodDomain || !stageDomain) {
      return json(
        { success: false, error: "Both store domains are required" },
        { status: 400 }
      );
    }

    console.log("⚙️ Syncing settings between:", prodDomain, "➡️", stageDomain);

    // Fetch production store settings
    const prodData = await callShopifyGraphQL(
      prodDomain,
      PROD_ACCESS_TOKEN,
      SHOP_SETTINGS_QUERY
    );
    if (prodData.error)
      return json({
        success: false,
        error: "Failed to fetch production store settings: " + prodData.error,
      });

    const prodSettings = prodData.data.shop;

    // Fetch staging store settings
    const stageData = await callShopifyGraphQL(
      stageDomain,
      STAGE_ACCESS_TOKEN,
      SHOP_SETTINGS_QUERY
    );
    if (stageData.error)
      return json({
        success: false,
        error: "Failed to fetch stage store settings: " + stageData.error,
      });

    const stageSettings = stageData.data.shop;

    // 💾 Optional: Save backup locally (for debug)
    if (process.env.NODE_ENV !== "production") {
      const backupDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const backupFile = path.join(
        backupDir,
        `stage-backup-${Date.now()}.json`
      );
      fs.writeFileSync(backupFile, JSON.stringify(stageSettings, null, 2));
    }

    // 🧾 Compare both stores (since direct update is not allowed)
    const differences = Object.keys(prodSettings).reduce((diff, key) => {
      if (prodSettings[key] !== stageSettings[key]) {
        diff[key] = {
          production: prodSettings[key],
          staging: stageSettings[key],
        };
      }
      return diff;
    }, {});

    if (Object.keys(differences).length === 0) {
      return json({
        success: true,
        message: "✅ Both stores have identical settings.",
      });
    }

    return json({
      success: true,
      message: "⚠️ Settings differ between stores.",
      differences,
    });
  } catch (err) {
    console.error("Settings sync error:", err);
    return json({ success: false, error: err.message });
  }
}
