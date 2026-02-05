import React, { ReactNode, Suspense } from 'react';
import FriSidebar from './FriSidebar';
import FriTopBar from './FriTopBar';
import { Loader2 } from 'lucide-react';

interface FriDashboardLayoutProps {
  children: ReactNode;
}

// Error fallback component
const LayoutError = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Indlæsning fejlede</h1>
      <p className="text-gray-600 mb-6">Der var et problem med indlæsning af dashboardet.</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-6 py-2 rounded-lg"
      >
        Genindlæs siden
      </button>
    </div>
  </div>
);

// Sidebar wrapper with error handling
const SafeSidebar = () => {
  return (
    <Suspense fallback={<div className="w-64 bg-gray-200 animate-pulse" />}>
      <div className="flex-shrink-0">
        <FriSidebar />
      </div>
    </Suspense>
  );
};

const FriDashboardLayout: React.FC<FriDashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed position */}
      <Suspense fallback={<div className="w-64 bg-gray-200 animate-pulse flex-shrink-0" />}>
        <div className="flex-shrink-0 fixed left-0 top-0 h-screen w-64 z-50">
          <FriSidebar />
        </div>
      </Suspense>

      {/* Main Content Area - with margin for sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        {/* Top Bar */}
        <Suspense fallback={<div className="h-16 bg-gray-200 animate-pulse" />}>
          <FriTopBar />
        </Suspense>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
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
