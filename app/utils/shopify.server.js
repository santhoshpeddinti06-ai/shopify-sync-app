
// Use default import (or destructure Shopify from package)
// /app/utils/shopify.server.js
const { Clients } = require('@shopify/shopify-api')

export const shopifyGraphQLClient=(storeDomain,accessToken) =>{
  return new Clients.GraphQL(storeDomain,accessToken)
};

