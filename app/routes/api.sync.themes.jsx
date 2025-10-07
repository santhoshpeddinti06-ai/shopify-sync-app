// app/routes/api.sync.themes.jsx
import { json } from "@remix-run/node";
import fetch from "node-fetch";

const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;
const PROD_SHOP = process.env.PROD_SHOP;

export const loader = async () => {
  try {
    const response = await fetch(`https://${PROD_SHOP}/admin/api/2025-10/themes.json`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": PROD_ACCESS_TOKEN,
      },
    });

    const data = await response.json();
    return json({ themes: data.themes || [] });
  } catch (error) {
    console.error("Error fetching production themes:", error);
    return json({ error: "Failed to fetch themes" }, { status: 500 });
  }
};
