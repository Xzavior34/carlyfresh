/**
 * Public landing page for token-signed email actions:
 *   /order-action/:token?action=accept|reject|claim
 */
import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";

export default function OrderAction() {
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const action = (params.get("action") ?? "accept") as "accept" | "reject" | "claim";
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!token) return;
    setState("loading");
    const body: Record<string, unknown> = { token, action };
    if (action === "claim" && user) body.driver_id = user.id;

    const { data, error } = await supabase.functions.invoke("order-action", { body });
    if (error || !data?.ok) {
      setState("error");
      setMessage(data?.error ?? error?.message ?? "Action failed");
    } else {
      setState("success");
      setMessage(action === "claim" ? "Job claimed — check your driver dashboard." : `Order ${action === "accept" ? "accepted" : "rejected"}.`);
    }
  };

  useEffect(() => {
    if (action !== "claim") submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-16 container mx-auto px-6 max-w-md text-center">
        {action === "claim" && state === "idle" && (
          <>
            <h1 className="font-display text-3xl font-bold text-foreground">Claim this delivery job</h1>
            <p className="font-body text-muted-foreground mt-2">First driver to claim wins. You have 5 minutes.</p>
            {!user ? (
              <div className="mt-6">
                <p className="font-body text-sm text-muted-foreground mb-3">Please log in as a driver to claim.</p>
                <Button asChild><Link to="/login">Log in</Link></Button>
              </div>
            ) : (
              <Button onClick={submit} className="mt-6 font-body">Claim Job</Button>
            )}
          </>
        )}
        {state === "loading" && <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />}
        {state === "success" && (
          <>
            <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
            <h1 className="font-display text-2xl font-bold text-foreground mt-4">Done</h1>
            <p className="font-body text-muted-foreground mt-2">{message}</p>
            <Button asChild className="mt-6 font-body"><Link to="/">Return home</Link></Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="h-14 w-14 text-destructive mx-auto" />
            <h1 className="font-display text-2xl font-bold text-foreground mt-4">Couldn't complete action</h1>
            <p className="font-body text-muted-foreground mt-2">{message}</p>
            <Button asChild variant="outline" className="mt-6 font-body"><Link to="/">Return home</Link></Button>
          </>
        )}
      </main>
    </div>
  );
}
