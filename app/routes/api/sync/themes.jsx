import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  try {
    // Define your environment variables
    const PROD_SHOP = process.env.PROD_SHOP;
    const STAGE_SHOP = process.env.STAGE_SHOP;
    const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN;
    const STAGE_ACCESS_TOKEN = process.env.STAGE_ACCESS_TOKEN;

    // Fetch themes from production store
    const prodResponse = await fetch(`https://${PROD_SHOP}/admin/api/2025-10/themes.json`, {
      headers: {
        'X-Shopify-Access-Token': PROD_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!prodResponse.ok) {
      return json({ error: 'Failed to fetch themes from production' }, { status: 500 });
    }

    const { themes } = await prodResponse.json();

    // For now, just send the list of themes back to frontend
    return json({ themes });

  } catch (err) {
    console.error(err);
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
};
