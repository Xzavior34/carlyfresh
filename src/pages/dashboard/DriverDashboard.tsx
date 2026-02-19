/**
 * Driver Dashboard — Mobile-Optimized Portal
 * DATA SOURCE: Currently using mock data for UI approval. Awaiting DB connection.
 * TODO: Connect to Supabase tables: driver_status, delivery_jobs, driver_earnings
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Package,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  driverAvailableJobs,
  driverEarnings,
  formatNaira,
} from "@/lib/mockDashboardData";

export default function DriverDashboard() {
  // TODO: Sync driver online status with Supabase realtime
  const [isOnline, setIsOnline] = useState(false);
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());

  const handleAcceptJob = (jobId: string) => {
    // TODO: POST /api/jobs/:id/accept
    setAcceptedJobs((prev) => new Set(prev).add(jobId));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Driver Dashboard
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Manage your deliveries and track earnings.
        </p>
      </div>

      {/* STATUS TOGGLE — The hero element */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card
          className={`border-2 transition-all duration-500 ${
            isOnline
              ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10"
              : "border-border bg-card"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`relative h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isOnline ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Zap className="h-7 w-7" />
                  {isOnline && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-card animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {isOnline ? "Accepting deliveries" : "Toggle to start accepting jobs"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={setIsOnline}
                className="h-8 w-14 data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Earnings Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Today", value: formatNaira(driverEarnings.today), icon: Wallet, accent: "text-primary" },
            { label: "This Week", value: formatNaira(driverEarnings.thisWeek), icon: TrendingUp, accent: "text-accent" },
            { label: "This Month", value: formatNaira(driverEarnings.thisMonth), icon: TrendingUp, accent: "text-primary" },
            { label: "Trips Today", value: driverEarnings.completedToday.toString(), icon: CheckCircle2, accent: "text-accent" },
          ].map((item) => (
            <Card key={item.label} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-4 w-4 ${item.accent}`} />
                  <span className="text-[10px] font-body uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <p className="font-display text-lg font-bold text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Available Jobs Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Available Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* TODO: Subscribe to real-time delivery_jobs table */}
            <AnimatePresence>
              {driverAvailableJobs.map((job) => {
                const isAccepted = acceptedJobs.has(job.id);
                return (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`rounded-xl border p-4 transition-all ${
                      isAccepted
                        ? "border-primary/30 bg-primary/5"
                        : "border-border hover:border-primary/20 hover:bg-muted/20"
                    }`}
                  >
                    {/* Route */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        <div className="w-px h-8 bg-border" />
                        <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-body uppercase text-muted-foreground">Pickup</span>
                          <Badge variant="secondary" className="text-[10px] font-body">{job.id}</Badge>
                        </div>
                        <p className="font-body text-sm font-medium text-foreground truncate">
                          {job.pickupVendor}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">{job.pickupAddress}</p>

                        <div className="mt-3">
                          <span className="text-[10px] font-body uppercase text-muted-foreground">Dropoff</span>
                          <p className="font-body text-sm font-medium text-foreground">
                            {job.deliveryArea}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">{job.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer: distance, payout, action */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {job.distance}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                          <Package className="h-3 w-3" />
                          {job.items.length} item{job.items.length > 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg font-bold text-primary">
                          {formatNaira(job.estimatedPayout)}
                        </span>
                        {isAccepted ? (
                          <Badge className="bg-primary text-primary-foreground font-body text-xs border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="font-body text-xs bg-primary hover:bg-primary/90"
                            onClick={() => handleAcceptJob(job.id)}
                            disabled={!isOnline}
                          >
                            Accept Job
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {!isOnline && (
              <p className="text-center font-body text-sm text-muted-foreground py-4">
                Go online to start accepting delivery jobs.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
