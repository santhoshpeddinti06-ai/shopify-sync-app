// app/utils/shopify-products.server.js
export async function fetchProductsFromStore(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2025-10/products.json?limit=50`, {
    headers: { "X-Shopify-Access-Token": accessToken }
  });
  const data = await res.json();
  return data.products || [];
}

export async function pushProductToStore(shop, accessToken, product) {
  const res = await fetch(`https://${shop}/admin/api/2025-10/products.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  const data = await res.json();
  return data.product;
}
