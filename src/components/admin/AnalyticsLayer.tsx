import { BarChart3, Sparkles, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AnalyticsLayer() {
  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-lg text-indigo-600 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Predictive Arrays & Recommendation Subsystems
          </CardTitle>
          <CardDescription className="font-body text-sm">
            Data pipeline status overview managing automated client-side user personalization matrices.
          </CardDescription>
        </CardHeader>
        <CardContent className="font-body space-y-4">
          {/* Main Behavioral Engine Endpoint Status */}
          <div className="p-4 border rounded-xl bg-secondary/10 flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Real-time Recommendation Engine: <span className="text-emerald-500">Active</span></p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Continuously harvesting structured storefront engagement profiles and active keyword queries to autonomously feed targeted data points to the home page <strong>Recommended Carousel</strong> components.
              </p>
            </div>
          </div>

          {/* Engine Parameters Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 border rounded-lg bg-background flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block tracking-wider">Data Source</span>
                <span className="text-xs font-medium text-foreground">Search params & history logs</span>
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-background flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block tracking-wider">Output State</span>
                <span className="text-xs font-medium text-foreground">Dynamic carousel node buffers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
