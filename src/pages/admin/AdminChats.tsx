import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Send, MessageSquare, ArrowLeft, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import {
  displayName,
  roleLabel,
  roleBadgeClass,
  formatMsgTime,
} from "@/lib/chatIdentity";

type ChatMessage = Tables<"chats">;
type RawProfile = Tables<"profiles">;
type Profile = RawProfile & { role: string; email?: string | null };

type Conversation = {
  otherUserId: string;
  otherUser: Profile | null;
  messages: ChatMessage[];
  lastMessageAt: string;
};

export default function AdminChats() {
  const { user } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvKey, setActiveConvKey] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, Profile>>(new Map());
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const preselectedChat = location.state?.startChat as
    | { userId: string; name?: string }
    | undefined;

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    const [profRes, rolesRes, messagesRes, emailsRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase
        .from("chats")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true }),
      supabase.rpc("admin_get_users_emails" as any),
    ]);

    if (profRes.error || rolesRes.error || messagesRes.error) {
      console.error("Error fetching admin chat data");
      setLoading(false);
      return;
    }

    const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
    const emailMap = new Map(
      ((emailsRes.data as any[]) || []).map((e) => [e.user_id, e.email])
    );

    const profiles: Profile[] = profRes.data.map((p) => ({
      ...p,
      role: roleMap.get(p.user_id) || "buyer",
      email: emailMap.get(p.user_id) || null,
    }));

    const newProfileMap = new Map(profiles.map((p) => [p.user_id, p]));
    setProfileMap(newProfileMap);
    setAllProfiles(profiles);

    const convMap = new Map<string, Conversation>();
    (messagesRes.data || []).forEach((m) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          otherUserId: otherId,
          otherUser: newProfileMap.get(otherId) || null,
          messages: [],
          lastMessageAt: m.created_at,
        });
      }
      const conv = convMap.get(otherId)!;
      conv.messages.push(m);
      if (m.created_at > conv.lastMessageAt) conv.lastMessageAt = m.created_at;
    });

    if (preselectedChat) {
      if (!convMap.has(preselectedChat.userId)) {
        convMap.set(preselectedChat.userId, {
          otherUserId: preselectedChat.userId,
          otherUser: newProfileMap.get(preselectedChat.userId) || null,
          messages: [],
          lastMessageAt: new Date().toISOString(),
        });
      }
      setActiveConvKey(preselectedChat.userId);
    }

    const sorted = Array.from(convMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    setConversations(sorted);
    if (!preselectedChat) {
      setActiveConvKey((prev) => prev || sorted[0]?.otherUserId || null);
    }
    setLoading(false);
  }, [user, preselectedChat]);

  useEffect(() => {
    if (!user) return;
    fetchAllData();

    const channel = supabase
      .channel("admin_chats_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => fetchAllData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAllData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, activeConvKey]);

  if (!user) return null;

  const activeConversation = conversations.find(
    (c) => c.otherUserId === activeConvKey
  );

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage("");

    const { data, error } = await supabase
      .from("chats")
      .insert({
        sender_id: user.id,
        receiver_id: activeConversation.otherUserId,
        message: msgText,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Message not sent",
        description: error.message,
        variant: "destructive",
      });
      setNewMessage(msgText);
    } else if (data) {
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.otherUserId === activeConversation.otherUserId
            ? { ...c, messages: [...c.messages, data], lastMessageAt: data.created_at }
            : c
        );
        // If conversation doesn't exist yet (new from search), add it
        const exists = prev.some(
          (c) => c.otherUserId === activeConversation.otherUserId
        );
        const base = exists
          ? updated
          : [
              {
                otherUserId: activeConversation.otherUserId,
                otherUser: activeConversation.otherUser,
                messages: [data],
                lastMessageAt: data.created_at,
              },
              ...updated,
            ];
        return base.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
      });

      // Push notification — server derives sender name as "CarlyFresh Admin"
      supabase.functions
        .invoke("onesignal-direct-message", {
          body: { receiver_id: activeConversation.otherUserId, message: msgText },
        })
        .catch((err) => console.error("Push error:", err));
    }

    sendingRef.current = false;
    setSending(false);
  };

  // ── Display list ──────────────────────────────────────────────────────────
  const hasSearch = searchQuery.trim().length > 0;
  const q = searchQuery.toLowerCase();

  let displayList: Array<{
    userId: string;
    user: Profile | null;
    role: string;
    lastMessage: string | null;
  }> = [];

  if (hasSearch) {
    displayList = allProfiles
      .filter((p) => {
        const name = p.full_name?.toLowerCase() || "";
        const biz = p.business_name?.toLowerCase() || "";
        const email = p.email?.toLowerCase() || "";
        return name.includes(q) || biz.includes(q) || email.includes(q);
      })
      .map((p) => {
        const existing = conversations.find((c) => c.otherUserId === p.user_id);
        return {
          userId: p.user_id,
          user: p,
          role: p.role,
          lastMessage:
            existing?.messages.length
              ? existing.messages[existing.messages.length - 1].message
              : null,
        };
      });
  } else {
    displayList = conversations.map((c) => {
      const p = allProfiles.find((x) => x.user_id === c.otherUserId);
      return {
        userId: c.otherUserId,
        user: p || c.otherUser,
        role: p?.role || "buyer",
        lastMessage: c.messages.length
          ? c.messages[c.messages.length - 1].message
          : null,
      };
    });
  }

  const handleSelectUser = (item: (typeof displayList)[0]) => {
    if (hasSearch) {
      const exists = conversations.some((c) => c.otherUserId === item.userId);
      if (!exists) {
        setConversations((prev) => [
          {
            otherUserId: item.userId,
            otherUser: item.user,
            messages: [],
            lastMessageAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setSearchQuery("");
    }
    setActiveConvKey(item.userId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary" />
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary">
            Support Inbox
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          Direct Messages
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row flex-1 bg-card border rounded-xl overflow-hidden shadow-sm max-h-[800px]">
          {/* ── Sidebar ── */}
          <div
            className={`md:w-1/3 border-r flex flex-col ${
              activeConvKey ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-4 border-b font-body space-y-3">
              <div className="font-semibold">Users</div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, business or email..."
                  className="pl-9 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {displayList.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground text-sm font-body">
                  {hasSearch
                    ? "No users found matching your search."
                    : "No conversations. Search for a user to begin."}
                </p>
              ) : (
                <div className="flex flex-col">
                  {displayList.map((item) => {
                    const isActive = activeConvKey === item.userId;
                    const name = displayName(item.user, item.role);
                    return (
                      <button
                        key={item.userId}
                        onClick={() => handleSelectUser(item)}
                        className={`flex flex-col p-4 text-left border-b hover:bg-muted/50 transition-colors ${
                          isActive ? "bg-muted/80" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-sm truncate">
                            {name}
                          </span>
                          <span
                            className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                              roleBadgeClass[item.role] ||
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {roleLabel(item.role)}
                          </span>
                        </div>
                        {item.user?.email && (
                          <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {item.user.email}
                          </span>
                        )}
                        {item.lastMessage && (
                          <span className="text-xs text-muted-foreground truncate mt-1">
                            {item.lastMessage}
                          </span>
                        )}
                        {!item.lastMessage && hasSearch && (
                          <span className="text-xs text-muted-foreground/60 italic mt-1">
                            Start a new conversation
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ── Chat area ── */}
          <div
            className={`flex-1 flex flex-col ${
              !activeConvKey ? "hidden md:flex" : "flex"
            }`}
          >
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground font-body">
                Select a user to start messaging
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setActiveConvKey(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col">
                    <h3 className="font-semibold font-display">
                      {displayName(
                        activeConversation.otherUser,
                        activeConversation.otherUser?.role || "buyer"
                      )}
                    </h3>
                    {activeConversation.otherUser?.email && (
                      <span className="text-xs text-muted-foreground font-body">
                        {activeConversation.otherUser.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/10"
                  ref={scrollRef}
                >
                  {activeConversation.messages.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm font-body mt-10">
                      Send a message to start the conversation.
                    </p>
                  ) : (
                    activeConversation.messages.map((msg, i) => {
                      const isMe = msg.sender_id === user.id;
                      const senderProfile = profileMap.get(msg.sender_id);
                      const senderRole = isMe
                        ? "admin"
                        : senderProfile?.role || "buyer";
                      const senderName = isMe
                        ? "CarlyFresh · Admin"
                        : displayName(senderProfile, senderRole);

                      return (
                        <div
                          key={msg.id || i}
                          className={`flex flex-col ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {!isMe && (
                              <span
                                className={`text-[8px] uppercase tracking-wider font-bold px-1 py-0.5 rounded ${
                                  roleBadgeClass[senderRole] || ""
                                }`}
                              >
                                {roleLabel(senderRole)}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {senderName}
                            </span>
                          </div>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 font-body text-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm"
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1">
                            {formatMsgTime(msg.created_at)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-background">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
