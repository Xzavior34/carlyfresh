import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function CustomerProfile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setFullName(data.full_name || ""); setPhone(data.phone || ""); }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("user_id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated!" });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <User className="h-8 w-8 text-primary" /> My Profile
            </h1>
            <Card className="border border-border">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="font-body">Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="font-body" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-body" placeholder="+234..." />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Email</Label>
                  <Input value={user?.email || ""} disabled className="font-body bg-muted" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full font-body">
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
