// app/routes/api/sync/stage-themes.jsx
import { json } from "@remix-run/node";

export async function loader() {
  const STAGE_SHOP = process.env.STAGE_SHOP; // e.g. santosh-dev2.myshopify.com
  const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN; // your stage access token

  if (!STAGE_SHOP || !STAGE_ACCESS_TOKEN) {
    return json({ error: "Missing stage shop or token" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://${STAGE_SHOP}/admin/api/2025-10/themes.json`, {
      headers: {
        "X-Shopify-Access-Token": STAGE_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return json({ error: "Failed to fetch stage themes", details: errorText }, { status: 500 });
    }

    const data = await response.json();
    return json({ themes: data.themes || [] });
  } catch (error) {
    console.error("Stage Themes Error:", error);
    return json({ error: "Unexpected error fetching stage themes" }, { status: 500 });
  }
}
