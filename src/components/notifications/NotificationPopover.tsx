import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: string;
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
      .limit(20)
      .then(({ data }) => {
        if (mounted && data) setItems(data as Notification[]);
      });

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev].slice(0, 20));
          toast(n.message);
        },
      )
      .subscribe();

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

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className={`relative p-2 transition-colors ${className ?? "text-foreground/70 hover:text-primary"}`}
          onClick={markAllRead}
        >
          <Bell size={22} />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
            >
              {unread}
            </motion.span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-display text-sm font-semibold text-foreground">Notifications</span>
          <span className="font-body text-xs text-muted-foreground">{items.length}</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center font-body text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            items.map((n) => (
              <a
                key={n.id}
                href={n.link || "#"}
                onClick={(e) => !n.link && e.preventDefault()}
                className={`block border-b border-border px-4 py-3 transition-colors hover:bg-secondary ${
                  !n.read_status ? "bg-accent/5" : ""
                }`}
              >
                <p className="font-body text-sm text-foreground">{n.message}</p>
                <p className="mt-1 font-body text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </a>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
