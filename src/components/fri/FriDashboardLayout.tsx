import React, { ReactNode, Suspense, useEffect } from 'react';
import FriSidebar from './FriSidebar';
import FriTopBar from './FriTopBar';
import { Loader2 } from 'lucide-react';

interface FriDashboardLayoutProps {
  children: ReactNode;
}

// Error fallback component
const LayoutError = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-brown-900 mb-4">Indlæsning fejlede</h1>
      <p className="text-gray-600 mb-6">Der var et problem med indlæsning af dashboardet.</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
      >
        Genindlæs siden
      </button>
    </div>
  </div>
);

// Sidebar wrapper with error handling
const SafeSidebar = () => {
  return (
    <Suspense fallback={<div className="w-64 bg-white animate-pulse" />}>
      <div className="flex-shrink-0">
        <FriSidebar />
      </div>
    </Suspense>
  );
};

const FriDashboardLayout: React.FC<FriDashboardLayoutProps> = ({ children }) => {
  // Force light mode for the dashboard - remove any dark class
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    html.classList.remove('dark');
    html.style.colorScheme = 'light';
    return () => {
      if (wasDark) html.classList.add('dark');
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed position */}
      <Suspense fallback={<div className="w-64 bg-white animate-pulse flex-shrink-0 border-r border-gray-200" />}>
        <div className="flex-shrink-0 fixed left-0 top-0 h-screen w-64 z-50">
          <FriSidebar />
        </div>
      </Suspense>

      {/* Main Content Area - with margin for sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        {/* Top Bar */}
        <Suspense fallback={<div className="h-16 bg-white animate-pulse border-b border-gray-200" />}>
          <FriTopBar />
        </Suspense>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6 lg:p-8">
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-pink-500 animate-spin mx-auto" />
                  <p className="text-gray-500 font-medium">Indlæser...</p>
                </div>
              </div>
            }>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FriDashboardLayout;
