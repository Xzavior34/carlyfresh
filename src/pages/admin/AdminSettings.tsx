import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground font-body text-sm">Platform configuration</p>
      </div>
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> General Settings
          </CardTitle>
          <CardDescription className="font-body">Platform-wide configuration will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-body text-sm text-muted-foreground">Settings panel coming soon. This will include payment gateway configuration, notification preferences, and platform policies.</p>
        </CardContent>
      </Card>
    </div>
  );
}
