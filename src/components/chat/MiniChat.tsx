import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
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

interface Props {
  orderId: string;
  receiverId: string;
  triggerLabel?: string;
}

const MiniChat = ({ orderId, receiverId, triggerLabel = "Open chat" }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
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
      .channel(`chat:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [open, orderId, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user) return;
    setText("");
    await supabase.from("chats").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      order_id: orderId,
      message: body,
    });
  };

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
                      className={`max-w-[75%] rounded-2xl px-4 py-2 font-body text-sm shadow-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground border border-border"
                      }`}
                    >
                      {m.message}
                      <div className={`mt-1 text-[10px] opacity-70`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!text.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default MiniChat;
