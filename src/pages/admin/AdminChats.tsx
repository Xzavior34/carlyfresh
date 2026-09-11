import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send, MessageSquare, ArrowLeft, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type ChatMessage = Tables<"chats">;
type Profile = Tables<"profiles">;

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
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // If we came from AdminUsers with state: { startChat: { userId, name } }
  const preselectedChat = location.state?.startChat as { userId: string, name?: string } | undefined;

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      // Admin might want to see all their chats
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

      const userIds = new Set<string>();
      (messages || []).forEach(m => {
        if (m.sender_id !== user.id) userIds.add(m.sender_id);
        if (m.receiver_id !== user.id) userIds.add(m.receiver_id);
      });
      if (preselectedChat) userIds.add(preselectedChat.userId);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", Array.from(userIds));
        
      const profileMap = new Map((profileData || []).map(p => [p.user_id, p]));
      setProfiles(profileMap);

      const convMap = new Map<string, Conversation>();

      (messages || []).forEach(m => {
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
        conv.lastMessageAt = m.created_at > conv.lastMessageAt ? m.created_at : conv.lastMessageAt;
      });

      if (preselectedChat) {
        if (!convMap.has(preselectedChat.userId)) {
          convMap.set(preselectedChat.userId, {
            otherUserId: preselectedChat.userId,
            otherUser: profileMap.get(preselectedChat.userId) || null,
            messages: [],
            lastMessageAt: new Date().toISOString(),
          });
        }
        setActiveConvKey(preselectedChat.userId);
      }

      const sortedConvs = Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      
      setConversations(sortedConvs);
      if (!preselectedChat && sortedConvs.length > 0 && !activeConvKey) {
        setActiveConvKey(sortedConvs[0].otherUserId);
      }
      setLoading(false);
    };

    fetchChats();

    const channel = supabase.channel('admin_chats_realtime')
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
          const existingIdx = updated.findIndex(c => c.otherUserId === otherId);
          
          if (existingIdx >= 0) {
            updated[existingIdx].messages.push(newMsg);
            updated[existingIdx].lastMessageAt = newMsg.created_at;
          } else {
            fetchChats(); // refresh for new user
          }
          return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, preselectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, activeConvKey]);

  if (!user) return null;

  const activeConversation = conversations.find(c => c.otherUserId === activeConvKey);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage("");

    const { data, error } = await supabase.from("chats").insert({
      sender_id: user.id,
      receiver_id: activeConversation.otherUserId,
      message: msgText
    }).select().single();

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      setNewMessage(msgText);
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

  const filteredConvs = conversations.filter(c => {
    const name = c.otherUser?.full_name?.toLowerCase() || '';
    const biz = c.otherUser?.business_name?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || biz.includes(q);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary">Support Inbox</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl mb-4">Direct Messages</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="flex flex-col md:flex-row flex-1 bg-card border rounded-xl overflow-hidden shadow-sm h-full max-h-[800px]">
          
          <div className={`md:w-1/3 border-r flex flex-col ${activeConvKey ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b font-body space-y-3">
              <div className="font-semibold">Users</div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-9 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm font-body">No conversations. Send a message from the Users tab.</div>
              ) : (
                <div className="flex flex-col">
                  {filteredConvs.map(conv => {
                    const isActive = activeConvKey === conv.otherUserId;
                    const name = conv.otherUser?.business_name || conv.otherUser?.full_name || 'Unknown User';
                    
                    return (
                      <button
                        key={conv.otherUserId}
                        onClick={() => setActiveConvKey(conv.otherUserId)}
                        className={`flex flex-col p-4 text-left border-b hover:bg-muted/50 transition-colors ${isActive ? 'bg-muted/80' : ''}`}
                      >
                        <span className="font-semibold text-sm truncate">{name}</span>
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

          <div className={`flex-1 flex flex-col ${!activeConvKey ? 'hidden md:flex' : 'flex'}`}>
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground font-body">
                Select a user to start messaging
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
    </div>
  );
}
