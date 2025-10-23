import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import {useEffect, useState} from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();
  const [direction,setDirection]=useState("stage-to-prod");

  // Save direction in sessionStorage (so it persists when navigating)
  useEffect(() => {
    const saved=sessionStorage.getItem("syncDirection");
    if(saved) setDirection(saved);
  },[]);

  const handleDirectionChange=(e)=>{
    const value=e.target.value;
    setDirection(value);
    sessionStorage.setItem("syncDirection",value);
  }

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {/*   Top Navbar */}
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/settings">Sync Settings </Link>
        <Link to="/app/themes">Theme Sync</Link>
        <Link to="/app/products">Products Sync</Link>
        <Link to="/app/collections">Collections Sync</Link>
        <Link to="/app/menus">Menu Sync</Link>
        <Link to="/app/locations">Location Sync</Link>
        <Link to="/app/shipping">Shipping Sync</Link>
        <Link to="/app/discounts">Discounts Sync</Link>
      </NavMenu>

      {/*       ==========Global Sync Direction Selector ========== */}
      <div
        style={{display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          background:"#f9f9f9",
          padding:"10px 20px",
          borderBottom:"1px solid #ddd"}}>
        <h2 style={{margin:0,fontSize:"18px",color:"#333"}}>
          🔁 Global Sync Direction
        </h2>

        <select value={direction}
                onChange={handleDirectionChange}
                style={{padding:"6px 10px",
                borderRadius:"6px",
                border:"1px solid #ccc",
                fontWeight:"500",
                  backgroundColor:"#fff",
                  cursor:"pointer"
                }}>
          <option value="stage-to-prod">Staging → Production</option>
          <option value="prod-to-stage">Production → Staging</option>
        </select>
      </div>
      {/* ------- page content -------- */}
      <div style={{padding:"20px"}}>
        {/* Pass direction to all child routes */}
      <Outlet context={{direction}} />
      </div>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
