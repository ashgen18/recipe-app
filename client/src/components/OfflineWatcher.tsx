import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Shows a friendly toast when the browser goes offline / comes back online.
 * Service worker also posts messages for offline navigations.
 */
export function OfflineWatcher() {
  useEffect(() => {
    function onOffline() {
      toast.warning("You are offline. Favorites and cached recipes still work.");
    }
    function onOnline() {
      toast.success("Back online");
    }

    function onSwMessage(event: MessageEvent) {
      if (event.data?.type === "OFFLINE_NAVIGATION") {
        toast.warning("Offline — showing cached content when available.");
      }
    }

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    if (!navigator.onLine) {
      onOffline();
    }

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, []);

  return null;
}
