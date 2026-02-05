import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useVisitorPresence } from '@/hooks/useVisitorPresence';

/**
 * Silent component that tracks visitor presence on the website.
 * Should be rendered once in the app root (outside admin routes).
 */
export const VisitorPresenceTracker = () => {
  const location = useLocation();
  const { updatePage } = useVisitorPresence({ isAdmin: false });

  // Update presence when route changes
  useEffect(() => {
    updatePage(location.pathname);
  }, [location.pathname, updatePage]);

  // This component doesn't render anything
  return null;
};
