import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
// Make sure to import your supabase client here:
import { supabase } from "@/lib/supabase"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email sent!", description: "Check your inbox for the reset link." });
      setIsSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div>
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
          <h2 className="font-display text-3xl font-bold text-foreground">Reset password</h2>
          <p className="mt-2 font-body text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <label className="font-body text-sm font-medium">Email</label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 font-body" 
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-12 font-body text-sm font-semibold gap-2">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending link…</> : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl text-center space-y-4">
            <h3 className="font-display font-semibold text-primary">Check your inbox</h3>
            <p className="text-sm font-body text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>. Please check your spam folder if you don't see it.
            </p>
            <Button variant="outline" onClick={() => setIsSent(false)} className="mt-4 w-full h-12">
              Try another email
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
