import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send, MessageSquare, Package, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type ChatMessage = Tables<"chats">;
type Profile = Tables<"profiles">;

type Conversation = {
  otherUserId: string;
  otherUser: Profile | null;
  orderId: string | null;
  messages: ChatMessage[];
  lastMessageAt: string;
};

export default function Chats() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvKey, setActiveConvKey] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If we came from an order page with state: { startChat: { vendorId, orderId } }
  const preselectedChat = location.state?.startChat as { vendorId: string, orderId: string } | undefined;

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      // Fetch all messages for current user
      const { data: messages, error } = await supabase
        .from("chats")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching chats:", error);
        setLoading(false);
        return;
      }

      // Extract unique user IDs to fetch profiles
      const userIds = new Set<string>();
      (messages || []).forEach(m => {
        if (m.sender_id !== user.id) userIds.add(m.sender_id);
        if (m.receiver_id !== user.id) userIds.add(m.receiver_id);
      });
      if (preselectedChat) userIds.add(preselectedChat.vendorId);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", Array.from(userIds));
        
      const profileMap = new Map((profileData || []).map(p => [p.user_id, p]));
      setProfiles(profileMap);

      // Group into conversations by other_user_id + order_id
      const convMap = new Map<string, Conversation>();
      
      const getConvKey = (otherId: string, orderId: string | null) => `${otherId}_${orderId || 'general'}`;

      (messages || []).forEach(m => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        const key = getConvKey(otherId, m.order_id);
        if (!convMap.has(key)) {
          convMap.set(key, {
            otherUserId: otherId,
            otherUser: profileMap.get(otherId) || null,
            orderId: m.order_id,
            messages: [],
            lastMessageAt: m.created_at,
          });
        }
        const conv = convMap.get(key)!;
        conv.messages.push(m);
        conv.lastMessageAt = m.created_at > conv.lastMessageAt ? m.created_at : conv.lastMessageAt;
      });

      // If preselected chat doesn't exist yet, create a blank one
      if (preselectedChat) {
        const key = getConvKey(preselectedChat.vendorId, preselectedChat.orderId);
        if (!convMap.has(key)) {
          convMap.set(key, {
            otherUserId: preselectedChat.vendorId,
            otherUser: profileMap.get(preselectedChat.vendorId) || null,
            orderId: preselectedChat.orderId,
            messages: [],
            lastMessageAt: new Date().toISOString(),
          });
        }
        setActiveConvKey(key);
      }

      const sortedConvs = Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      
      setConversations(sortedConvs);
      if (!preselectedChat && sortedConvs.length > 0 && !activeConvKey) {
        setActiveConvKey(getConvKey(sortedConvs[0].otherUserId, sortedConvs[0].orderId));
      }
      setLoading(false);
    };

    fetchChats();

    // Subscribe to new messages
    const channel = supabase.channel('chats_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chats',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setConversations(prev => {
          const updated = [...prev];
          const otherId = newMsg.sender_id;
          const key = `${otherId}_${newMsg.order_id || 'general'}`;
          const existingIdx = updated.findIndex(c => `${c.otherUserId}_${c.orderId || 'general'}` === key);
          
          if (existingIdx >= 0) {
            updated[existingIdx].messages.push(newMsg);
            updated[existingIdx].lastMessageAt = newMsg.created_at;
          } else {
            // New conversation arrived
            fetchChats(); // Easiest way to load new profiles & refresh
          }
          return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, preselectedChat]);

  // Scroll to bottom when messages update
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
          <h2 className="text-xl font-display font-semibold mb-2">Sign in to view messages</h2>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const activeConversation = conversations.find(c => `${c.otherUserId}_${c.orderId || 'general'}` === activeConvKey);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage("");

    const { data, error } = await supabase.from("chats").insert({
      sender_id: user.id,
      receiver_id: activeConversation.otherUserId,
      message: msgText,
      order_id: activeConversation.orderId
    }).select().single();

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      setNewMessage(msgText); // restore
    } else if (data) {
      setConversations(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c === activeConversation);
        if (idx >= 0) {
          updated[idx].messages.push(data);
          updated[idx].lastMessageAt = data.created_at;
        }
        return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col h-[calc(100vh-64px)]">
        <h1 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Messages
        </h1>

        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 bg-card border rounded-xl overflow-hidden shadow-sm h-full max-h-[800px]">
            
            {/* Sidebar List */}
            <div className={`md:w-1/3 border-r flex flex-col ${activeConvKey ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b font-body font-semibold">Conversations</div>
              <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm font-body">No conversations yet.</div>
                ) : (
                  <div className="flex flex-col">
                    {conversations.map(conv => {
                      const key = `${conv.otherUserId}_${conv.orderId || 'general'}`;
                      const isActive = activeConvKey === key;
                      const name = conv.otherUser?.business_name || conv.otherUser?.full_name || 'Unknown User';
                      
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveConvKey(key)}
                          className={`flex flex-col p-4 text-left border-b hover:bg-muted/50 transition-colors ${isActive ? 'bg-muted/80' : ''}`}
                        >
                          <span className="font-semibold text-sm truncate">{name}</span>
                          {conv.orderId && (
                            <span className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
                              <Package className="h-3 w-3" /> Order context
                            </span>
                          )}
                          {conv.messages.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate mt-1">
                              {conv.messages[conv.messages.length - 1].message}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!activeConvKey ? 'hidden md:flex' : 'flex'}`}>
              {!activeConversation ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground font-body">
                  Select a conversation to start messaging
                </div>
              ) : (
                <>
                  <div className="p-4 border-b flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConvKey(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h3 className="font-semibold font-display">
                        {activeConversation.otherUser?.business_name || activeConversation.otherUser?.full_name || 'Unknown User'}
                      </h3>
                      {activeConversation.orderId && (
                        <Link to={`/orders/${activeConversation.orderId}`} className="text-xs text-primary hover:underline">
                          View Order Details
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/10" ref={scrollRef}>
                    {activeConversation.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm font-body mt-10">
                        Send a message to start the conversation.
                      </div>
                    ) : (
                      activeConversation.messages.map((msg, i) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 font-body text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                              {msg.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-4 border-t bg-background">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button type="submit" disabled={!newMessage.trim() || sending} size="icon">
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
