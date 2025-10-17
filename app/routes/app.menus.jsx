// app/routes/app.menus.jsx
import MenuSync from "../components/MenuSync.jsx";

export default function MenuSyncPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700 ,marginLeft:30}}> Menu Sync</h1>
      <p style={{ marginBottom: 20, color: "#555",marginLeft:30,marginTop:30 }}>
        Backup and push navigation menus between staging and production stores.
      </p>
      <MenuSync />
    </div>
  );
}
