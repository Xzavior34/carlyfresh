import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  formatMessageTime,
  getChatDisplayName,
  getRoleLabel,
  getRoleTagClasses,
} from "@/lib/chat-identity";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  order_id: string | null;
  message: string;
  created_at: string;
}

interface Participant {
  role: string;
  name: string;
}

interface Props {
  orderId: string;
  receiverId: string;
  triggerLabel?: string;
}

const MiniChat = ({ orderId, receiverId, triggerLabel = "Open chat" }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    let mounted = true;

    supabase
      .from("chats")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (mounted && data) setMessages(data as ChatMessage[]);
      });

    const channel = supabase
      .channel(`chat:${orderId}-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        },
      );
    channel.subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [open, orderId, user]);

  // Load names + roles for everyone in this order chat (admins show as CarlyFresh).
  useEffect(() => {
    if (!open) return;
    let mounted = true;

    (async () => {
      const senderIds = [...new Set([receiverId, ...messages.map((m) => m.sender_id)])];
      if (senderIds.length === 0) return;

      const [profRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, business_name, full_name").in("user_id", senderIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", senderIds),
      ]);

      if (!mounted) return;

      const roleMap = new Map((rolesRes.data ?? []).map((r) => [r.user_id, r.role]));
      const map = new Map<string, Participant>();
      for (const p of profRes.data ?? []) {
        const role = roleMap.get(p.user_id) ?? "buyer";
        map.set(p.user_id, { role, name: getChatDisplayName(p, role) });
      }
      setParticipants(map);
    })();

    return () => {
      mounted = false;
    };
  }, [open, receiverId, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user || sending) return;
    setSending(true);
    setText("");

    const { error } = await supabase.from("chats").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      order_id: orderId,
      message: body,
    });

    if (error) {
      setText(body); // restore what the user typed so nothing is lost
    } else {
      // Push notification — the function validates the signed-in sender itself.
      supabase.functions
        .invoke("onesignal-direct-message", {
          body: { receiver_id: receiverId, message: body },
        })
        .catch((err) => console.error("Push error:", err));
    }
    setSending(false);
  };

  const senderName = (senderId: string) => {
    if (senderId === user?.id) return "You";
    return participants.get(senderId)?.name ?? "CarlyFresh User";
  };

  const senderRole = (senderId: string) => participants.get(senderId)?.role ?? "buyer";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle size={16} /> {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display">Order chat</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto bg-secondary px-4 py-4">
          {messages.length === 0 ? (
            <p className="mt-10 text-center font-body text-sm text-muted-foreground">
              No messages yet — start the conversation.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`flex max-w-[75%] flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">
                          {senderName(m.sender_id)}
                        </span>
                        {m.sender_id !== user?.id && (
                          <span
                            className={`rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide ${getRoleTagClasses(senderRole(m.sender_id))}`}
                          >
                            {getRoleLabel(senderRole(m.sender_id))}
                          </span>
                        )}
                        <span>{formatMessageTime(m.created_at)}</span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2 font-body text-sm shadow-sm ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground border border-border"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <form
          onSubmit={send}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={!text.trim() || sending}>
            <Send size={16} />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default MiniChat;
