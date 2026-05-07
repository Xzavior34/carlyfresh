import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Store, Bell, UserCog } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const [storeName, setStoreName] = useState("CarlyFresh");
  const [supportEmail, setSupportEmail] = useState("support@carlyfresh.com");
  const [currency, setCurrency] = useState("NGN");
  const [orderEmails, setOrderEmails] = useState(true);
  const [newsletterAlerts, setNewsletterAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [marketingDigest, setMarketingDigest] = useState(false);
  const [displayName, setDisplayName] = useState("Admin");
  const [twoFactor, setTwoFactor] = useState(false);

  const save = (section: string) => () => toast({ title: `${section} saved`, description: "Your preferences have been updated." });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground font-body text-sm">Manage your platform configuration</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="general" className="font-body gap-1.5"><Store className="h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="notifications" className="font-body gap-1.5"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="profile" className="font-body gap-1.5"><UserCog className="h-4 w-4" />Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">General Store Settings</CardTitle>
              <CardDescription className="font-body">Configure your storefront identity and defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="font-body">Store Name</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="font-body" />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Support Email</Label>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="font-body" />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="font-body" />
              </div>
              <Button className="font-body" onClick={save("General settings")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Notifications</CardTitle>
              <CardDescription className="font-body">Choose what alerts you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: "Order alerts", desc: "Get notified for every new order", val: orderEmails, set: setOrderEmails },
                { label: "Newsletter signups", desc: "When a new subscriber joins", val: newsletterAlerts, set: setNewsletterAlerts },
                { label: "SMS alerts", desc: "Critical events via text message", val: smsAlerts, set: setSmsAlerts },
                { label: "Weekly marketing digest", desc: "Performance summary every Monday", val: marketingDigest, set: setMarketingDigest },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <p className="font-body font-medium text-foreground">{row.label}</p>
                    <p className="font-body text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                  <Switch checked={row.val} onCheckedChange={row.set} />
                </div>
              ))}
              <Button className="font-body" onClick={save("Notification preferences")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Profile Preferences</CardTitle>
              <CardDescription className="font-body">Manage your admin profile and security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="font-body">Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="font-body" />
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <div>
                  <p className="font-body font-medium text-foreground">Two-factor authentication</p>
                  <p className="font-body text-xs text-muted-foreground">Adds an extra layer of security on sign-in</p>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </div>
              <Button className="font-body" onClick={save("Profile preferences")}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
