import { useEffect, useState } from "react";
import { Bell, CheckCircle, XCircle, Loader2, Navigation, ShoppingBag, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  title?: string | null;
  message: string;
  link: string | null;
  read_status: boolean;
  created_at: string;
}

interface Props {
  className?: string;
}

const NotificationPopover = ({ className }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actedItems, setActedItems] = useState<Record<string, "accepted" | "declined">>({});
  const unread = items.filter((n) => !n.read_status).length;

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    let mounted = true;

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (mounted && data) setItems(data as Notification[]);
      });

    const channel = supabase
      .channel(`notifications:${user.id}-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev.filter((i) => i.id !== n.id)].slice(0, 30));
          toast(n.title ? `${n.title}: ${n.message}` : n.message);
        },
      );
    channel.subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read_status: true })));
    await supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("user_id", user.id)
      .eq("read_status", false);
  };

  const extractOrderId = (link: string | null): string | null => {
    if (!link) return null;
    try {
      if (link.includes("accept=")) {
        const urlParams = new URLSearchParams(link.split("?")[1] || "");
        return urlParams.get("accept");
      }
      if (link.includes("/orders/")) {
        const parts = link.split("/orders/");
        return parts[1]?.split("?")[0] || null;
      }
      if (link.includes("open=")) {
        const urlParams = new URLSearchParams(link.split("?")[1] || "");
        return urlParams.get("open");
      }
    } catch {
      return null;
    }
    return null;
  };

  const handleDriverAction = async (notificationId: string, orderId: string, action: "accept" | "decline") => {
    if (!user) return;
    setActionInProgress(`${notificationId}_${action}`);
    try {
      const edgeAction = action === "accept" ? "driver_accept" : "driver_decline";
      const { data, error } = await supabase.functions.invoke("order-action", {
        body: {
          action: edgeAction,
          order_id: orderId,
          driver_id: user.id,
        },
      });

      if (error || (data && !data.ok && data.error)) {
        throw new Error(error?.message || data?.error || `Failed to ${action} delivery`);
      }

      setActedItems((prev) => ({ ...prev, [notificationId]: action === "accept" ? "accepted" : "declined" }));
      if (action === "accept") {
        toast.success("🚚 Delivery Accepted! Head over to Active Deliveries to complete pickup.");
      } else {
        toast.info("Delivery declined. System has automatically passed the job to the next available driver.");
      }

      // Mark notification as read
      await supabase.from("notifications").update({ read_status: true }).eq("id", notificationId);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} delivery`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleVendorAction = async (notificationId: string, orderId: string, action: "accept" | "decline") => {
    if (!user) return;
    setActionInProgress(`${notificationId}_${action}`);
    try {
      const edgeAction = action === "accept" ? "vendor_accept" : "vendor_decline";
      const { data, error } = await supabase.functions.invoke("order-action", {
        body: {
          action: edgeAction,
          order_id: orderId,
          vendor_id: user.id,
        },
      });

      if (error || (data && !data.ok && data.error)) {
        throw new Error(error?.message || data?.error || `Failed to ${action} order`);
      }

      setActedItems((prev) => ({ ...prev, [notificationId]: action === "accept" ? "accepted" : "declined" }));
      if (action === "accept") {
        toast.success("🍳 Order Accepted! 15-minute preparation window started.");
      } else {
        toast.info("Order declined. Buyer has been notified.");
      }

      // Mark notification as read
      await supabase.from("notifications").update({ read_status: true }).eq("id", notificationId);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} order`);
    } finally {
      setActionInProgress(null);
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className={`relative p-2 transition-colors rounded-full hover:bg-muted/50 ${
            className ?? "text-foreground/70 hover:text-primary"
          }`}
          onClick={markAllRead}
        >
          <Bell size={20} />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground shadow-sm animate-pulse"
            >
              {unread}
            </motion.span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 sm:w-96 p-0 shadow-xl border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-body">
                {unread} new
              </Badge>
            )}
          </div>
          <span className="font-body text-xs text-muted-foreground">{items.length} total</span>
        </div>
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-body text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            items.map((n) => {
              const isDeliveryOffer = n.type === "delivery_offer" || n.type === "delivery_assigned";
              const isVendorOrder = n.type === "new_order" || n.type === "order_offer" || n.type === "order_paid" || n.type === "order_pending";
              const orderId = extractOrderId(n.link);
              const actedState = actedItems[n.id];

              return (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors ${
                    !n.read_status ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isDeliveryOffer ? (
                        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Navigation className="h-4 w-4" />
                        </div>
                      ) : isVendorOrder ? (
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                          <Bell className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.title && (
                        <p className="font-display text-xs font-bold text-foreground truncate">{n.title}</p>
                      )}
                      <p className="font-body text-xs text-foreground/90 leading-relaxed mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-body text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {!n.read_status && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Actionable buttons for Drivers */}
                      {isDeliveryOffer && orderId && !actedState && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold gap-1 rounded-md"
                            disabled={Boolean(actionInProgress)}
                            onClick={() => handleDriverAction(n.id, orderId, "accept")}
                          >
                            {actionInProgress === `${n.id}_accept` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Accept Delivery
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs font-body text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border rounded-md"
                            disabled={Boolean(actionInProgress)}
                            onClick={() => handleDriverAction(n.id, orderId, "decline")}
                          >
                            {actionInProgress === `${n.id}_decline` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            Decline
                          </Button>
                        </div>
                      )}

                      {/* Actionable buttons for Vendors */}
                      {isVendorOrder && orderId && !actedState && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-body font-semibold gap-1 rounded-md"
                            disabled={Boolean(actionInProgress)}
                            onClick={() => handleVendorAction(n.id, orderId, "accept")}
                          >
                            {actionInProgress === `${n.id}_accept` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Accept Order
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs font-body text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border rounded-md"
                            disabled={Boolean(actionInProgress)}
                            onClick={() => handleVendorAction(n.id, orderId, "decline")}
                          >
                            {actionInProgress === `${n.id}_decline` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            Decline
                          </Button>
                        </div>
                      )}

                      {/* Acted Feedback Badge */}
                      {actedState && (
                        <div className="mt-2 flex items-center gap-1.5">
                          {actedState === "accepted" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] gap-1 font-body">
                              <CheckCircle className="h-3 w-3" /> Accepted & In Progress
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground border-border text-[10px] gap-1 font-body">
                              <XCircle className="h-3 w-3 text-destructive" /> Declined (Passed to next)
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
