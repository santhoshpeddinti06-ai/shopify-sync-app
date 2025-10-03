import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

import SyncThemes from "../../components/SyncThemes.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Theme Sync Dashboard</h1>
        <p className={styles.text}>
          Manage syncing themes between <strong>santosh-dev</strong> and {""}
          <strong>santosh-dev2</strong>
        </p>
        {/* Show login form only if required */}
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}

        <hr style={{margin: "20px 0"}} />

        {/* Add Theme Sync function */}
        <div>
          <h2 className={styles.heading}>Theme Sync</h2>
          <SyncThemes />
        </div>
      </div>
    </div>
  );
}
