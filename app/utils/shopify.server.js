const { Clients } = require('@shopify/shopify-api');

export const shopifyGraphQLClient = (storeDomain, accessToken) => {
  return new Clients.GraphQL(storeDomain, accessToken);
};

export async function fetchSettings(storeDomain, accessToken) {
  const client = shopifyGraphQLClient(storeDomain, accessToken);

  const query = `{
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
  }`;

  const response = await client.query({ data: query });
  return response.body.data.shop;
}

export async function pushSettings(storeDomain, accessToken, settings) {
  const client = shopifyGraphQLClient(storeDomain, accessToken);

  const mutation = `
    mutation shopUpdate($input: ShopInput!) {
      shopUpdate(input: $input) {
        shop {
          name
          email
          currencyCode
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
