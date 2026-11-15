import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useBudgetStore from '@/stores/useBudgetStore';

const POLL_MS = 60_000;

// Keeps the number of open requests fresh for the menu of an admin: on every change of page,
// every minute while the tab is in front, and when the tab comes back to the front
export const useOpenRequests = (enabled: boolean) => {
  const getOpenRequests = useBudgetStore((state) => state.getOpenRequests);
  const { pathname } = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: the pathname is the trigger, the count is asked again on every change of page
  useEffect(() => {
    if (!enabled) return;

    const refresh = () => {
      // A failed count is not worth an error, the next one will correct it
      if (!document.hidden) getOpenRequests().catch(() => undefined);
    };

    refresh();

    const timer = window.setInterval(refresh, POLL_MS);

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [enabled, pathname, getOpenRequests]);
};
