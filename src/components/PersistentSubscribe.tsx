/**
 * PersistentSubscribe -- CarlyFresh
 * Floating push-notification opt-in button.
 *
 * Renders only when Notification.permission is NOT 'granted'.
 * Clicking it calls Notification.requestPermission() (the browser
 * native prompt) and, on approval, reloads the page so the
 * OneSignal initializer in App.tsx can complete the subscription
 * and sync the push token to the database.
 */

import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PersistentSubscribe = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Only show if the browser supports Notifications AND permission is not yet granted
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission !== "granted"
    ) {
      setVisible(true);
    }
  }, []);

  /** Request browser notification permission */
  const handleSubscribe = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        // Reload so OneSignal can complete subscription sync
        window.location.reload();
      } else {
        // User denied -- hide the button gracefully
        setVisible(false);
      }
    } catch (err) {
      console.warn("[PersistentSubscribe] Permission request failed:", err);
    } finally {
      setRequesting(false);
    }
  };

  // Hidden if permission already granted, dismissed, or browser does not support
  if (!visible || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="persistent-subscribe-btn"
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
        initial={{ opacity: 0, scale: 0.8, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 16 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {/* Dismiss button (small X above the main button) */}
        <button
          aria-label="Dismiss notification prompt"
          onClick={() => setDismissed(true)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/80 text-muted-foreground shadow-md transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={13} />
        </button>

        {/* Main subscribe button */}
        <motion.button
          id="subscribe-notifications-btn"
          aria-label="Enable push notifications"
          onClick={handleSubscribe}
          disabled={requesting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={[
            "group flex items-center gap-2 rounded-full px-4 py-3 shadow-xl transition-all",
            requesting
              ? "cursor-wait bg-primary/70 text-primary-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer",
            "font-body text-sm font-semibold",
          ].join(" ")}
        >
          {requesting ? (
            <BellRing size={18} className="animate-bounce" />
          ) : (
            <Bell size={18} className="group-hover:animate-bounce transition-transform" />
          )}
          {requesting ? "Enabling..." : "Enable Notifications"}
        </motion.button>

        {/* Tooltip label */}
        <p className="mr-1 font-body text-[11px] text-muted-foreground text-right leading-tight">
          Get order updates and alerts
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersistentSubscribe;
