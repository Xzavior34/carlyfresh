import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Listen for the password recovery event from Supabase
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Ready to accept new password");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ 
        title: "Passwords do not match", 
        description: "Please make sure both passwords are exactly the same.",
        variant: "destructive" 
      });
      return;
    }

    if (password.length < 6) {
      toast({ 
        title: "Password too short", 
        description: "Your new password must be at least 6 characters long.",
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    
    // Supabase automatically uses the session from the URL link to authorize this update
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Your password has been updated." });
      
      // Optional: Sign them out so they are forced to log in with the new password
      await supabase.auth.signOut();
      navigate("/login");
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
          <h2 className="font-display text-3xl font-bold text-foreground">Set new password</h2>
          <p className="mt-2 font-body text-muted-foreground">
            Please type your new password below to regain access to your account.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-2">
            <label className="font-body text-sm font-medium">New Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 font-body" 
            />
          </div>

          <div className="space-y-2">
            <label className="font-body text-sm font-medium">Confirm New Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 font-body" 
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-12 font-body text-sm font-semibold gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Save Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default UpdatePassword;
