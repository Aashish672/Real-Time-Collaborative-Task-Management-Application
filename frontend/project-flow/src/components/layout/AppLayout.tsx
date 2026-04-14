import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <AppHeader />
      <main
        className="overflow-y-auto"
        style={{
          marginLeft: "var(--sidebar-width)",
          marginTop: "var(--header-height)",
          minHeight: "calc(100vh - var(--header-height))",
        }}
      >
        <div className="px-6 py-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
