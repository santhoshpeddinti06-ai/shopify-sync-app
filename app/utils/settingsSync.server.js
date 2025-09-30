// Example: Fetch shop settings from a store

// /app/utils/settingsSync.server.js
const { shopifyGraphQLClient } =require('./shopify.server.js');

export async function fetchSettings(storeDomain, accessToken) {
  const client = shopifyGraphQLClient(storeDomain, accessToken);

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

// Push settings to target store (partial example)
export async function pushSettings(targetDomain, accessToken, settings) {
  const client = shopifyGraphQLClient(targetDomain, accessToken);

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

  const variables = { input: settings };
  const response = await client.query({ data: { query: mutation, variables } });
  return response.body.data.shopUpdate;
}
