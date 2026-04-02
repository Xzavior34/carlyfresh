import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Leaf, Loader2, MailCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [bypassing, setBypassing] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });
    if (error) {
      toast.error(error.message || "Verification failed. Please try again.");
      setVerifying(false);
      return;
    }
    toast.success("Email verified! Redirecting…");
    setTimeout(() => navigate("/login"), 1500);
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("No email address found. Please sign up again.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) {
      toast.error(error.message || "Failed to resend code");
    } else {
      toast.success("Verification code resent to " + email);
    }
    setResending(false);
  };

  const handleDevBypass = async () => {
    setBypassing(true);
    toast.success("Verification bypassed (Dev Mode). Redirecting to login…");
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <Link to="/" className="inline-flex items-center gap-2 mx-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">CarlyFresh</span>
        </Link>

        <div className="space-y-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Verify your email</h1>
          <p className="font-body text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-foreground">{email || "your email"}</span>.
            Enter it below to activate your account.
          </p>
          <div className="flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-left mt-3">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="font-body text-xs text-yellow-800">
              If you don't see the email within 60 seconds, please check your <strong>Spam/Junk folder</strong>. Free-tier email delivery can sometimes be delayed.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleVerify}
            disabled={verifying || otp.length !== 6}
            className="w-full h-12 font-body font-semibold gap-2"
          >
            {verifying ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : "Verify Email"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={resending}
            className="w-full font-body text-sm gap-2"
          >
            {resending ? <><Loader2 className="h-4 w-4 animate-spin" /> Resending…</> : "Didn't receive the code? Resend"}
          </Button>
        </div>

        <p className="font-body text-xs text-muted-foreground">
          Wrong email?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Sign up again
          </Link>
        </p>

        {/* Dev bypass */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDevBypass}
            disabled={bypassing}
            className="font-body text-xs text-muted-foreground gap-2 opacity-60 hover:opacity-100"
          >
            {bypassing ? <><Loader2 className="h-3 w-3 animate-spin" /> Bypassing…</> : "Bypass Verification (Dev Mode)"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
