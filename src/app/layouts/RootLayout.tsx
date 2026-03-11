import React from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { BottomNav } from "../components/BottomNav";

export function RootLayout() {
  const location = useLocation();
  const hideNavPaths = ["/", "/register", "/setup"];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="font-sans antialiased bg-[#F7F9FC] min-h-screen text-slate-800 flex justify-center selection:bg-blue-100">
      <main className="w-full max-w-md bg-[#F7F9FC] shadow-2xl overflow-hidden relative min-h-screen border-x border-slate-100 flex flex-col">
        <div className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </div>
        {showNav && <BottomNav />}
      </main>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // In a real app we'd check context, but for mock purposes we just render
  return <>{children}</>;
}
