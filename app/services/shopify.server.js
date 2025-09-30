// app/services/shopify.server.js
export function getShopifyClient(storeDomain, accessToken) {
  // dynamic require ensures Vite won't bundle it for ESM
  const Shopify = require('@shopify/shopify-api');

  return new Shopify.Clients.Graphql(storeDomain, accessToken);
}

export async function fetchSettings(storeDomain, accessToken) {
  const client = getShopifyClient(storeDomain, accessToken);

  const query = `{
    shop {
      name
      email
      domain
      myshopifyDomain
      timezoneOffset
      weightUnit
      currency
    }
  }`;

  const response = await client.query({ data: query });
  return response.body.data.shop;
}

export async function pushSettings(storeDomain, accessToken, settings) {
  const client = getShopifyClient(storeDomain, accessToken);

  const mutation = `
    mutation shopUpdate($input: ShopInput!) {
      shopUpdate(input: $input) {
        shop {
          name
          email
          currency
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await client.query({
    data: { query: mutation, variables: { input: settings } }
  });

  return response.body.data.shopUpdate;
}
