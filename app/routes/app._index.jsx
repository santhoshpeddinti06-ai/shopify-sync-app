import { useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const navigate = useNavigate();

  const sections = [
    { title: "Sync Settings", path: "/app/settings" },
    { title: "Theme Sync", path: "/app/themes" },
    { title: "Products Sync", path: "/app/products" },
    { title: "Collections Sync", path: "/app/collections" },
    { title: "Menu Sync", path: "/app/menus" },
    { title: "Location Sync", path: "/app/locations" },
    { title: "Shipping Sync", path: "/app/shipping" },
    { title: "Discounts Sync", path: "/app/discounts" },
  ];

  return (
    <Page>
      <TitleBar title="Remix Store Syncing App" />

      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Welcome to the Remix Store Syncing App
              </Text>
              <Text as="p" variant="bodyMd">
                This app allows you to sync data between your{" "}
                <strong>Staging</strong> and <strong>Production</strong> Shopify
                stores. You can back up, compare, and push changes for themes,
                settings, products, collections, menus, and more.
              </Text>

              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    🔁 Available Sync Modules
                  </Text>
                  <InlineStack gap="200" wrap>
                    {sections.map((section) => (
                      <Button
                        key={section.path}
                        onClick={() => navigate(section.path)}
                        variant="primary"
                      >
                        {section.title}
                      </Button>
                    ))}
                  </InlineStack>
                </BlockStack>
              </Card>

              <Text as="p" variant="bodyMd" tone="subdued">
                Use the navigation bar or buttons above to access each sync
                feature. You can control the sync direction globally using the
                dropdown in the app header.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                App Overview
              </Text>
              <Text as="p" variant="bodyMd">
                • Two-way synchronization between Staging ↔ Production stores.
                <br />
                • Individual sync options for themes, products, menus, etc.
                <br />
                • Global direction control for sync flow.
                <br />
                • Easy monitoring and debugging support.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
