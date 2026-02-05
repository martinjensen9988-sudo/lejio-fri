import React, { ReactNode, Suspense } from 'react';
import FriSidebar from './FriSidebar';
import FriTopBar from './FriTopBar';
import { Loader2, Crown } from 'lucide-react';

interface FriDashboardLayoutProps {
  children: ReactNode;
}

// Error fallback component
const LayoutError = () => (
  <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
    <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-8 max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-white mb-4">Indlæsning fejlede</h1>
      <p className="text-white/60 mb-6">Der var et problem med indlæsning af dashboardet.</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black px-6 py-2 rounded-xl font-semibold hover:brightness-110 transition-all"
      >
        Genindlæs siden
      </button>
    </div>
  </div>
);

// Sidebar wrapper with error handling
const SafeSidebar = () => {
  return (
    <Suspense fallback={<div className="w-64 bg-[#0a0d14] animate-pulse" />}>
      <div className="flex-shrink-0">
        <FriSidebar />
      </div>
    </Suspense>
  );
};

const FriDashboardLayout: React.FC<FriDashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#0a0d14]">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/3 w-[500px] h-[500px] bg-blue-500/3 rounded-full blur-[150px]" />
      </div>

      {/* Sidebar - Fixed position */}
      <Suspense fallback={<div className="w-64 bg-[#0a0d14] animate-pulse flex-shrink-0" />}>
        <div className="flex-shrink-0 fixed left-0 top-0 h-screen w-64 z-50">
          <FriSidebar />
        </div>
      </Suspense>

      {/* Main Content Area - with margin for sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        {/* Top Bar */}
        <Suspense fallback={<div className="h-16 bg-[#0a0d14] animate-pulse border-b border-white/10" />}>
          <FriTopBar />
        </Suspense>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
                    <Crown className="absolute inset-0 m-auto w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-white/60 font-medium">Indlæser...</p>
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
