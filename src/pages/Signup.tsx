/**
 * Signup Page — Registration with role selection & Zod validation
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Leaf, Eye, EyeOff, ShoppingCart, Sprout, Truck, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type AppRole = "buyer" | "seller" | "driver";

const roles: { value: AppRole; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "buyer", label: "Customer", desc: "Shop fresh produce", icon: <ShoppingCart className="h-5 w-5" /> },
  { value: "seller", label: "Farmer / Vendor", desc: "Sell your products", icon: <Sprout className="h-5 w-5" /> },
  { value: "driver", label: "Delivery Driver", desc: "Earn delivering orders", icon: <Truck className="h-5 w-5" /> },
];

const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const [selectedRole, setSelectedRole] = useState<AppRole>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.fullName, selectedRole);

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Check if the user got auto-confirmed (email verification disabled on backend)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      // User is already logged in — email confirm is off
      toast({ title: "Account created!", description: "Welcome to CarlyFresh!" });
      const dashMap: Record<string, string> = { buyer: "/dashboard/buyer", seller: "/dashboard/seller", driver: "/dashboard/driver", admin: "/dashboard/admin" };
      navigate(dashMap[selectedRole] || "/dashboard/buyer");
    } else {
      toast({ title: "Account created!", description: "Please check your email for a verification code." });
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-5xl font-bold text-primary-foreground mb-4">Join CarlyFresh</h1>
          <p className="font-body text-primary-foreground/80 text-lg max-w-md mx-auto">
            Whether you're buying, selling, or delivering — there's a place for you.
          </p>
        </motion.div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <Link to="/" className="font-display text-2xl font-bold text-primary lg:hidden block mb-8">CarlyFresh</Link>
            <h2 className="font-display text-3xl font-bold text-foreground">Create your account</h2>
            <p className="mt-2 font-body text-muted-foreground">Select your account type and get started in minutes</p>
          </div>

          {/* Role selector */}
          <div>
            <p className="font-body text-sm font-medium mb-3">Select Your Account Type *</p>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all font-body text-xs ${
                    selectedRole === r.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {selectedRole === r.value && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  {r.icon}
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight text-center">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm font-medium">Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} className="h-12 font-body" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm font-medium">Email</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" {...field} className="h-12 font-body" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm font-medium">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="h-12 font-body pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" disabled={submitting} className="w-full h-12 font-body text-sm font-semibold gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create Account"}
              </Button>
            </form>
          </Form>

          <p className="text-center font-body text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
