/**
 * Seller Onboarding — "Partner with CarlyFresh"
 * DATA SOURCE: Form UI only. No backend submission yet.
 * TODO: POST form data to Supabase `seller_applications` table
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const sellerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  location: z.string().min(5, "Location is required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(10, "Valid account number required"),
  accountName: z.string().min(2, "Account name is required"),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

const productCategories = [
  "Fresh Produce",
  "Livestock",
  "Oils & Spices",
  "Bulk/Wholesale",
];

export default function SellerOnboarding() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      businessName: "",
      contactPerson: "",
      location: "",
      categories: [],
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const onSubmit = (data: SellerFormValues) => {
    // TODO: Insert into Supabase `seller_applications` table
    console.log("Seller application:", data);
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
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                      <Leaf className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="font-display text-2xl font-bold text-foreground">
                        Partner with CarlyFresh
                      </h1>
                      <p className="font-body text-sm text-muted-foreground">
                        Join our network of trusted vendors
                      </p>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      {/* Business Info */}
                      <div className="space-y-4">
                        <p className="text-xs font-body uppercase tracking-wider text-muted-foreground font-semibold">
                          Business Information
                        </p>
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-sm">Farm / Business Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Mama Nkechi's Farm" className="font-body" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-sm">Contact Person</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" className="font-body" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-sm">Location / Address</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 12 Market Road, Aba, Abia State" className="font-body" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Categories */}
                      <div className="space-y-3">
                        <p className="text-xs font-body uppercase tracking-wider text-muted-foreground font-semibold">
                          Product Categories
                        </p>
                        <FormField
                          control={form.control}
                          name="categories"
                          render={() => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-3">
                                {productCategories.map((cat) => (
                                  <FormField
                                    key={cat}
                                    control={form.control}
                                    name="categories"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(cat)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                field.onChange([...field.value, cat]);
                                              } else {
                                                field.onChange(field.value?.filter((v: string) => v !== cat));
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <Label className="font-body text-sm text-foreground cursor-pointer">
                                          {cat}
                                        </Label>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Bank Details */}
                      <div className="space-y-4">
                        <p className="text-xs font-body uppercase tracking-wider text-muted-foreground font-semibold">
                          Bank Account Details
                        </p>
                        <FormField
                          control={form.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-body text-sm">Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. First Bank" className="font-body" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-body text-sm">Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="0123456789" className="font-body" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="accountName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-body text-sm">Account Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Account holder" className="font-body" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full font-body text-sm py-6 bg-primary hover:bg-primary/90"
                      >
                        Submit Application
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
              <Card className="border border-primary/20 shadow-xl">
                <CardContent className="p-8 md:p-12 text-center">
                  <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    Application Received!
                  </h2>
                  <p className="font-body text-muted-foreground mt-3 max-w-sm mx-auto">
                    Thank you for partnering with CarlyFresh. Your application is under review.
                    We'll reach out within 24-48 hours.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="font-body text-sm text-accent font-medium">Pending Verification</span>
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
