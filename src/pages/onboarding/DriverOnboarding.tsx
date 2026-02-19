/**
 * Driver Onboarding — "Deliver Freshness. Earn Daily."
 * DATA SOURCE: Form UI only. No backend submission yet.
 * TODO: POST form data to Supabase `driver_applications` table
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Truck, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const driverSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  vehicleType: z.string().min(1, "Select a vehicle type"),
  licensePlate: z.string().min(3, "License plate is required"),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function DriverOnboarding() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      vehicleType: "",
      licensePlate: "",
    },
  });

  const onSubmit = (data: DriverFormValues) => {
    // TODO: Insert into Supabase `driver_applications` table
    console.log("Driver application:", data);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CarlyFresh
        </Link>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border border-border shadow-xl">
                <CardContent className="p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                      <Truck className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h1 className="font-display text-2xl font-bold text-foreground">
                        Deliver Freshness. Earn Daily.
                      </h1>
                      <p className="font-body text-sm text-muted-foreground">
                        Join the CarlyFresh delivery fleet
                      </p>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-body text-sm">Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Musa Ibrahim" className="font-body" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-body text-sm">Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 08012345678" className="font-body" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vehicleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-body text-sm">Vehicle Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="font-body">
                                  <SelectValue placeholder="Select your vehicle" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="motorcycle" className="font-body">Motorcycle</SelectItem>
                                <SelectItem value="car" className="font-body">Car</SelectItem>
                                <SelectItem value="mini-van" className="font-body">Mini-Van</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="licensePlate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-body text-sm">License Plate Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. ABC-123-XY" className="font-body" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full font-body text-sm py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        Apply to Drive
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Card className="border border-accent/20 shadow-xl">
                <CardContent className="p-8 md:p-12 text-center">
                  <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-accent" />
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    Application Received!
                  </h2>
                  <p className="font-body text-muted-foreground mt-3 max-w-sm mx-auto">
                    Welcome to the CarlyFresh delivery team! Your application is being reviewed.
                    We'll contact you within 24 hours.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-body text-sm text-primary font-medium">Pending Verification</span>
                  </div>
                  <div className="mt-8">
                    <Button asChild variant="outline" className="font-body">
                      <Link to="/">Return to Home</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
