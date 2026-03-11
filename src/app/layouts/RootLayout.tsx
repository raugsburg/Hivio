import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import BottomNav from '../components/BottomNav';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AUTH_ROUTES = ['/', '/register'];

export default function RootLayout() {
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#e8edf2] flex items-start justify-center py-0 sm:py-8">
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-0 bg-[#F7F9FC] sm:rounded-3xl sm:shadow-2xl overflow-hidden relative">
        <div className={isAuthRoute ? '' : 'pb-20'}>
          <Outlet />
        </div>
        {!isAuthRoute && <BottomNav />}
      </div>
    </div>
  );
}
