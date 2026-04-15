import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import CommandPalette from "../shared/CommandPalette";

export default function AppLayout() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !token)) {
      navigate("/login");
    }
  }, [user, token, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette />
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
