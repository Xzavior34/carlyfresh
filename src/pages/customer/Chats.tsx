import { useState, useEffect, useRef } from "react";
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

type ChatMessage = Tables<"chats">;
type Profile = Tables<"profiles"> & { role: string };

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
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Support pre-selecting a vendor from an order page: { startChat: { userId } }
  const preselectedChat = location.state?.startChat as { userId?: string; vendorId?: string } | undefined;
  const preselectedId = preselectedChat?.userId || preselectedChat?.vendorId;

  const fetchAllData = async () => {
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
      console.error("Error fetching data");
      setLoading(false);
      return;
    }

    const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
    const profiles: Profile[] = profRes.data.map((p) => ({
      ...p,
      role: roleMap.get(p.user_id) || "buyer",
    }));
    // Exclude current user from list
    const otherProfiles = profiles.filter((p) => p.user_id !== user.id);
    setAllProfiles(otherProfiles);

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    const convMap = new Map<string, Conversation>();
    (messagesRes.data || []).forEach((m) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          otherUserId: otherId,
          otherUser: profileMap.get(otherId) || null,
          messages: [],
          lastMessageAt: m.created_at,
        });
      }
      const conv = convMap.get(otherId)!;
      conv.messages.push(m);
      conv.lastMessageAt =
        m.created_at > conv.lastMessageAt ? m.created_at : conv.lastMessageAt;
    });

    // Ensure pre-selected conversation exists
    if (preselectedId && !convMap.has(preselectedId)) {
      convMap.set(preselectedId, {
        otherUserId: preselectedId,
        otherUser: profileMap.get(preselectedId) || null,
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
    } else if (sorted.length > 0) {
      setActiveConvKey((prev) => prev || sorted[0].otherUserId);
    }

    setLoading(false);
  };

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
        () => {
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
    if (!newMessage.trim() || !activeConversation || sending) return;

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
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
      setNewMessage(msgText);
    } else if (data) {
      setConversations((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex(
          (c) => c.otherUserId === activeConversation.otherUserId
        );
        if (idx >= 0) {
          updated[idx].messages.push(data);
          updated[idx].lastMessageAt = data.created_at;
        }
        return updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
      });

      supabase.functions
        .invoke("onesignal-direct-message", {
          body: {
            receiver_id: activeConversation.otherUserId,
            sender_name: user.user_metadata?.full_name || "A user",
            message: msgText,
          },
        })
        .catch((err) => console.error("Push error:", err));
    }
    setSending(false);
  };

  const hasSearch = searchQuery.trim().length > 0;
  const q = searchQuery.toLowerCase();

  // When searching: show ALL users matching query
  // When not searching: show only existing conversations
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
            existing && existing.messages.length > 0
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
        lastMessage:
          c.messages.length > 0
            ? c.messages[c.messages.length - 1].message
            : null,
      };
    });
  }

  const roleColor: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    seller: "bg-amber-100 text-amber-700",
    driver: "bg-blue-100 text-blue-700",
    buyer: "bg-emerald-100 text-emerald-700",
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
            {/* Sidebar */}
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
                  <div className="p-8 text-center text-muted-foreground text-sm font-body">
                    {hasSearch
                      ? "No users found."
                      : "No conversations yet. Search for a user to start chatting."}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y">
                    {displayList.map((item) => {
                      const isActive = activeConvKey === item.userId;
                      const name =
                        item.user?.business_name ||
                        item.user?.full_name ||
                        "Unknown User";
                      const role = (item.user as Profile)?.role || "buyer";

                      return (
                        <button
                          key={item.userId}
                          onClick={() => {
                            // If search result, add to conversations list so it persists when search clears
                            if (hasSearch) {
                              const exists = conversations.find(
                                (c) => c.otherUserId === item.userId
                              );
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
                          }}
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
                                roleColor[role] || "bg-muted text-muted-foreground"
                              }`}
                            >
                              {role}
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

            {/* Chat area */}
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
                        {activeConversation.otherUser?.business_name ||
                          activeConversation.otherUser?.full_name ||
                          "Unknown User"}
                      </h3>
                      {activeConversation.otherUser && (
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                            roleColor[
                              (activeConversation.otherUser as Profile)?.role ||
                                "buyer"
                            ] || ""
                          }`}
                        >
                          {(activeConversation.otherUser as Profile)?.role ||
                            "buyer"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/10"
                    ref={scrollRef}
                  >
                    {activeConversation.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm font-body mt-10">
                        Send a message to start the conversation.
                      </div>
                    ) : (
                      activeConversation.messages.map((msg, i) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id || i}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2 font-body text-sm ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-muted text-foreground rounded-tl-sm"
                              }`}
                            >
                              {msg.message}
                            </div>
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
                        <Send className="h-4 w-4" />
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
