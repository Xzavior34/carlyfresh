import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, CheckCircle2, AlertCircle, Building2, Mail, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

export default function CustomerProfile() {
  const { user, role } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, business_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setBusinessName(data.business_name || "");
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedPhone = phone.trim();
    if (trimmedPhone && trimmedPhone.replace(/[^0-9]/g, "").length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with at least 10 digits (e.g. 08012345678 or +234...).",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setSavedSuccess(false);

    try {
      const updates: Record<string, any> = {
        user_id: user.id,
        full_name: fullName.trim() || null,
        phone: trimmedPhone || null,
      };

      if (role === "seller" || businessName.trim()) {
        updates.business_name = businessName.trim() || null;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(updates as any, { onConflict: "user_id" });

      if (error) throw error;

      setSavedSuccess(true);
      toast({
        title: "Profile Updated! 🎉",
        description: "Your contact details and phone number have been saved successfully.",
      });

      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Profile save error:", err);
      toast({
        title: "Error Saving Profile",
        description: err.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasPhone = Boolean(phone.trim());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" /> Profile & Contact
                </h1>
                <Badge variant="secondary" className="font-body text-xs capitalize bg-primary/10 text-primary">
                  {role || "Buyer"} Account
                </Badge>
              </div>
              <p className="text-muted-foreground font-body text-sm mt-1">
                Manage your account details and phone number for seamless delivery tracking.
              </p>
            </div>

            {/* Missing Phone Alert Banner */}
            {!hasPhone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs font-body space-y-1">
                  <p className="font-semibold text-sm">Action Recommended: Add your phone number</p>
                  <p className="leading-relaxed opacity-90">
                    Adding your active WhatsApp phone number lets you receive instant order receipts, delivery dispatch notices, and direct seller DM coordination.
                  </p>
                </div>
              </motion.div>
            )}

            <Card className="border border-border shadow-md bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-display">Account Information</CardTitle>
                <CardDescription className="font-body text-xs">
                  Your phone number will be used for delivery confirmations and WhatsApp receipts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-body text-sm font-semibold flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground" /> Full Name
                    </Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chinedu Okafor"
                      className="font-body rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-body text-sm font-semibold flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-primary" /> Phone Number (WhatsApp)
                      </Label>
                      {hasPhone && (
                        <span className="font-body text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 08012345678 or +2348012345678"
                      className="font-body rounded-xl tabular-nums focus-visible:ring-primary/40"
                    />
                    <p className="text-[11px] font-body text-muted-foreground">
                      Format: local (080...) or international (+234...). Drivers and sellers will contact you via this number.
                    </p>
                  </div>

                  {(role === "seller" || businessName) && (
                    <div className="space-y-2">
                      <Label className="font-body text-sm font-semibold flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-muted-foreground" /> Store / Business Name
                      </Label>
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Mama Put Kitchen & Groceries"
                        className="font-body rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="font-body text-sm font-semibold flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                    </Label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="font-body rounded-xl bg-muted/60 text-muted-foreground"
                    />
                    <p className="text-[10px] font-body text-muted-foreground">
                      Managed securely by your Supabase account.
                    </p>
                  </div>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full font-body font-semibold py-6 rounded-xl gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {saving ? (
                        <>Saving Changes…</>
                      ) : savedSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-white" /> Changes Saved!
                        </>
                      ) : (
                        <>Save Changes</>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
