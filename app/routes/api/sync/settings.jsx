import { json } from "@remix-run/node";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// Access tokens from environment
const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;
const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;

// GraphQL query to fetch shop settings
const SHOP_SETTINGS_QUERY = `
query {
  shop {
    name
    email
    myshopifyDomain
    primaryLocale
    currencyCode
    weightUnit
    moneyFormat
    taxesIncluded
    timezoneAbbreviation
  }
}
`;

// GraphQL mutation to update shop settings
const UPDATE_SHOP_SETTINGS_MUTATION = (input) => `
mutation {
  shopUpdate(input: ${JSON.stringify(input)}) {
    shop { name email currencyCode }
    userErrors { field message }
  }
}
`;

// Helper to call Shopify GraphQL Admin API
async function callShopifyGraphQL(storeDomain, token, query) {
  const res = await fetch(`https://${storeDomain}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function action({ request }) {
  try {
    const { prodDomain, stageDomain } = await request.json();

    if (!prodDomain || !stageDomain) {
      return json({ success: false, error: "Both store domains are required" }, { status: 400 });
    }

    // 1.Fetch prod store settings
    const prodData = await callShopifyGraphQL(prodDomain, PROD_ACCESS_TOKEN, SHOP_SETTINGS_QUERY);
    if (!prodData?.data?.shop) throw new Error("Failed to fetch production store settings");
    const prodSettings = prodData.data.shop;

    // 2.Fetch and backup stage store settings
    const stageData = await callShopifyGraphQL(stageDomain, STAGE_ACCESS_TOKEN, SHOP_SETTINGS_QUERY);
    if (!stageData?.data?.shop) throw new Error("Failed to fetch stage store settings");
    const stageSettings = stageData.data.shop;

    // Save backup to file
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `stage-backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(stageSettings, null, 2));

    // 3. Push prod settings to stage
    const mutation = UPDATE_SHOP_SETTINGS_MUTATION({
      name: prodSettings.name,
      email: prodSettings.email,
      currencyCode: prodSettings.currencyCode,
      weightUnit: prodSettings.weightUnit,
      moneyFormat: prodSettings.moneyFormat,
      primaryLocale: prodSettings.primaryLocale,
      taxesIncluded: prodSettings.taxesIncluded,
      timezoneAbbreviation: prodSettings.timezoneAbbreviation,
    });

    const updateRes = await callShopifyGraphQL(stageDomain, STAGE_ACCESS_TOKEN, mutation);

    // Check for errors
    const errors = updateRes?.data?.shopUpdate?.userErrors || [];
    if (errors.length > 0) {
      return json({ success: false, error: errors.map(e => e.message).join(", ") });
    }

    return json({ success: true });
  } catch (err) {
    console.error("Settings sync error:", err);
    return json({ success: false, error: err.message });
  }
}
