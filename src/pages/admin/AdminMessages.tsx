import { useState } from "react";
import { Send, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdminMessages() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both a title and a message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("onesignal-broadcast", {
        body: { title, message }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Broadcast Sent",
        description: "Your notification has been sent to all subscribed users.",
      });

      setTitle("");
      setMessage("");
    } catch (err: any) {
      console.error("Broadcast failed:", err);
      toast({
        title: "Broadcast Failed",
        description: err.message || "Could not send broadcast. Check Edge Function logs.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-primary">Communications</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Admin Broadcast</h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-muted-foreground">
          Send push notifications to all users who have opted into OneSignal notifications on the app or website.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Send a Notification
          </CardTitle>
          <CardDescription>
            This will immediately trigger a push notification to all users' devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold font-body">Notification Title</label>
            <Input 
              placeholder="e.g. Special Discount This Weekend!" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="font-body"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold font-body">Message</label>
            <Textarea 
              placeholder="Write your message here..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              rows={4}
              className="font-body"
            />
          </div>

          <Button onClick={handleBroadcast} disabled={isSending} className="w-full gap-2 md:w-auto font-body">
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Broadcast
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
