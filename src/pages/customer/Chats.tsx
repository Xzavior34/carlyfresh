import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send, MessageSquare, ArrowLeft, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
type Profile = RawProfile & { role: string };

type Conversation = {
  otherUserId: string;
  otherUser: Profile | null;
  messages: ChatMessage[];
  lastMessageAt: string;
};

export default function Chats() {
  const { user } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvKey, setActiveConvKey] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  // Map of user_id → Profile used for resolving sender names inside messages
  const [profileMap, setProfileMap] = useState<Map<string, Profile>>(new Map());

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  // Guard against double-submits at event level
  const sendingRef = useRef(false);

  // Support pre-selecting a chat target from another page
  const preselectedChat = location.state?.startChat as
    | { userId?: string; vendorId?: string }
    | undefined;
  const preselectedId = preselectedChat?.userId || preselectedChat?.vendorId;

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    const [profRes, rolesRes, messagesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase
        .from("chats")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true }),
    ]);

    if (profRes.error || rolesRes.error || messagesRes.error) {
      console.error("Error fetching chat data");
      setLoading(false);
      return;
    }

    const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
    const profiles: Profile[] = profRes.data.map((p) => ({
      ...p,
      role: roleMap.get(p.user_id) || "buyer",
    }));

    const newProfileMap = new Map(profiles.map((p) => [p.user_id, p]));
    setProfileMap(newProfileMap);

    // Exclude self from search list
    setAllProfiles(profiles.filter((p) => p.user_id !== user.id));

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

    // Ensure pre-selected conversation slot exists
    if (preselectedId && !convMap.has(preselectedId)) {
      convMap.set(preselectedId, {
        otherUserId: preselectedId,
        otherUser: newProfileMap.get(preselectedId) || null,
        messages: [],
        lastMessageAt: new Date().toISOString(),
      });
    }

    const sorted = Array.from(convMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    setConversations(sorted);

    if (preselectedId) {
      setActiveConvKey(preselectedId);
    } else {
      setActiveConvKey((prev) => prev || sorted[0]?.otherUserId || null);
    }

    setLoading(false);
  }, [user, preselectedId]);

  useEffect(() => {
    if (!user) return;
    fetchAllData();

    const channel = supabase
      .channel("chats_realtime_universal")
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

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, activeConvKey]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-display font-semibold mb-2">
            Sign in to view messages
          </h2>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const activeConversation = conversations.find(
    (c) => c.otherUserId === activeConvKey
  );

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against double-submit
    if (!newMessage.trim() || !activeConversation || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage(""); // Optimistically clear

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
      setNewMessage(msgText); // Restore on failure
    } else if (data) {
      // Append optimistically to local state
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUserId === activeConversation.otherUserId
            ? {
                ...c,
                messages: [...c.messages, data],
                lastMessageAt: data.created_at,
              }
            : c
        ).sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        )
      );

      // Fire-and-forget push notification (server derives sender identity)
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
    lastMessage: string | null;
  }> = [];

  if (hasSearch) {
    displayList = allProfiles
      .filter((p) => {
        const name = p.full_name?.toLowerCase() || "";
        const biz = p.business_name?.toLowerCase() || "";
        return name.includes(q) || biz.includes(q);
      })
      .map((p) => {
        const existing = conversations.find((c) => c.otherUserId === p.user_id);
        return {
          userId: p.user_id,
          user: p,
          lastMessage:
            existing?.messages.length
              ? existing.messages[existing.messages.length - 1].message
              : null,
        };
      });
  } else {
    displayList = conversations.map((c) => {
      const profile = allProfiles.find((p) => p.user_id === c.otherUserId);
      return {
        userId: c.otherUserId,
        user: profile || c.otherUser,
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col">
        <h1 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Messages
        </h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row bg-card border rounded-xl overflow-hidden shadow-sm h-[calc(100vh-240px)] min-h-[500px]">
            {/* ── Sidebar ── */}
            <div
              className={`md:w-80 border-r flex flex-col ${
                activeConvKey ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-3 border-b space-y-2">
                <p className="font-semibold font-body text-sm">Messages</p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search any user..."
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
                      ? "No users found."
                      : "No conversations yet. Search for a user to start chatting."}
                  </p>
                ) : (
                  <div className="flex flex-col divide-y">
                    {displayList.map((item) => {
                      const isActive = activeConvKey === item.userId;
                      const role = item.user?.role || "buyer";
                      const name = displayName(item.user, role);

                      return (
                        <button
                          key={item.userId}
                          onClick={() => handleSelectUser(item)}
                          className={`flex flex-col p-4 text-left hover:bg-muted/50 transition-colors ${
                            isActive ? "bg-muted/80" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="font-semibold text-sm truncate">
                              {name}
                            </span>
                            <span
                              className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                roleBadgeClass[role] ||
                                "bg-muted text-muted-foreground"
                              }`}
                            >
                              {roleLabel(role)}
                            </span>
                          </div>
                          {item.lastMessage ? (
                            <span className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.lastMessage}
                            </span>
                          ) : hasSearch ? (
                            <span className="text-xs text-muted-foreground/60 italic mt-0.5">
                              Start conversation
                            </span>
                          ) : null}
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
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground font-body gap-2">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                  <p>Search for a user above and start chatting</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b flex items-center gap-3 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setActiveConvKey(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h3 className="font-semibold font-display">
                        {displayName(
                          activeConversation.otherUser,
                          activeConversation.otherUser?.role || "buyer"
                        )}
                      </h3>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                          roleBadgeClass[
                            activeConversation.otherUser?.role || "buyer"
                          ] || ""
                        }`}
                      >
                        {roleLabel(activeConversation.otherUser?.role || "buyer")}
                      </span>
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
                        const senderRole = senderProfile?.role || "buyer";
                        const senderName = isMe
                          ? "You"
                          : displayName(senderProfile, senderRole);

                        return (
                          <div
                            key={msg.id || i}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            {/* Sender name + role tag */}
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
                            {/* Bubble */}
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2 font-body text-sm ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-muted text-foreground rounded-tl-sm"
                              }`}
                            >
                              {msg.message}
                            </div>
                            {/* Timestamp */}
                            <span className="text-[9px] text-muted-foreground mt-1">
                              {formatMsgTime(msg.created_at)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t bg-background shrink-0">
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
      </main>
      <Footer />
    </div>
  );
}
