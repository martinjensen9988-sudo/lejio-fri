import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import * as Sentry from "@sentry/react";

// Initialize Sentry for error tracking
initSentry();

// CRITICAL MARKER: v2-production-debugsession-2026-02
// This code must be deployed for debugging purposes

// Ensure PWA/service worker updates don't leave users with a cached HTML
// that references old hashed CSS/JS files (white screen / missing stylesheet).
// Provided by vite-plugin-pwa.
import { registerSW } from "virtual:pwa-register";

// Suppress Lovable dev environment warnings and errors
// These are benign dev-only artifacts and don't affect functionality
if (typeof window !== 'undefined') {
  // Suppress ref warnings from Lovable inspection system
  const originalError = console.error;
  console.error = function(...args) {
    const message = args[0]?.toString?.() || '';
    // Filter out Lovable-specific ref warnings (dev-only inspection)
    if (message.includes('Function components cannot be given refs') || 
        message.includes('Did you mean to use React.forwardRef')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress benign Lovable dev environment logs
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args[0]?.toString?.() || '';
    // Filter out WebSocket connection logs and workspace context messages
    if (message.includes('devserver_websocket_open') || 
        message.includes('Cannot change workspace in project context') ||
        message.includes("We're hiring") ||
        message.includes('Initializing RudderStack')) {
      return;
    }
    originalLog.apply(console, args);
  };

  // Suppress benign Lovable dev environment warnings
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args[0]?.toString?.() || '';
    // Filter out unrecognized feature warnings and iframe sandbox warnings (dev-only)
    if (message.includes('Unrecognized feature') || 
        message.includes('iframe') && message.includes('sandbox')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0]?.toString?.() || '';
    
    // Silently fail if URL contains Lovable token (dev-only)
    if (url.includes('__lovable_token')) {
      return Promise.reject(new Error('Lovable token resource not available (dev-only)'));
    }
    
    return originalFetch.apply(this, args);
  };
}

const isAzureSwaHost = typeof window !== 'undefined' && window.location.hostname.includes('azurestaticapps.net');

if (isAzureSwaHost && 'serviceWorker' in navigator) {
  // Avoid stale PWA caches on Azure SWA preview hosts.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

if (!isAzureSwaHost) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Force update and reload to the newest assets.
      window.location.reload();
    },
  });
}

// Wrap App with Sentry error tracking
const SentryApp = Sentry.withProfiler(App);

// Initialize debug tracking - this WILL be in the minified bundle
const debugInit = () => {
  window.__LEJIO_DEBUG = {
    appVersion: "2026.02.05.001",
    bundleTime: Date.now(),
    environment: "production"
  };
  return true;
};
debugInit();

const rootElement = document.getElementById("root");
console.log("🚀🚀🚀 MAIN.TSX EXECUTING - TIMESTAMP:", Date.now());
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;"><h1>ERROR: Root element not found</h1><p>Check console</p></div>';
} else {
  console.log('✅ Root element found, mounting React - BUILDVERSION_GH_ACTIONS_FORCE_v2');
  createRoot(rootElement).render(<SentryApp />);
  console.log('✅ React mounted successfully at BUILDVERSION_GH_ACTIONS_FORCE_v2');
}
