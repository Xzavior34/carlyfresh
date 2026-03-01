/**
 * Signup Page — Registration with role selection
 * DATA SOURCE: Lovable Cloud Auth + user_roles table
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Leaf, Eye, EyeOff, ShoppingCart, Sprout, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type AppRole = "buyer" | "seller" | "driver";

const roles: { value: AppRole; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "buyer", label: "Customer", desc: "Shop fresh produce", icon: <ShoppingCart className="h-5 w-5" /> },
  { value: "seller", label: "Farmer / Vendor", desc: "Sell your products", icon: <Sprout className="h-5 w-5" /> },
  { value: "driver", label: "Delivery Driver", desc: "Earn delivering orders", icon: <Truck className="h-5 w-5" /> },
];

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await signUp(email, password, fullName, selectedRole);

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    toast({
      title: "Account created!",
      description: "Please check your email to verify your account before signing in.",
    });
    navigate("/login");
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
          <h1 className="font-display text-5xl font-bold text-primary-foreground mb-4">
            Join CarlyFresh
          </h1>
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
            <Link to="/" className="font-display text-2xl font-bold text-primary lg:hidden block mb-8">
              CarlyFresh
            </Link>
            <h2 className="font-display text-3xl font-bold text-foreground">Create your account</h2>
            <p className="mt-2 font-body text-muted-foreground">
              Pick your role and get started in minutes
            </p>
          </div>

          {/* Role selector */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-body text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 font-body"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 font-body"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 font-body text-sm font-semibold"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="text-center font-body text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
