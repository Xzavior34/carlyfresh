// NOTE: Form submission is currently simulating a 200 OK response.
// TODO: Connect to Backend API for bulk order processing.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const businessSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(100),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(1, "Phone number is required").max(20),
  estimatedVolume: z.string().trim().min(1, "Estimated volume is required").max(100),
  message: z.string().trim().max(1000).optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

const BusinessForm = () => {
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: { companyName: "", contactPerson: "", email: "", phone: "", estimatedVolume: "", message: "" },
  });

  const onSubmit = (_data: BusinessFormValues) => {
    // TODO: Send to backend API
    toast.success("Inquiry submitted!", {
      description: "Our business team will contact you within 48 hours.",
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField control={form.control} name="companyName" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body text-sm">Company Name</FormLabel>
              <FormControl><Input placeholder="Acme Restaurant" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="contactPerson" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body text-sm">Contact Person</FormLabel>
              <FormControl><Input placeholder="John Doe" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body text-sm">Email</FormLabel>
              <FormControl><Input type="email" placeholder="john@acme.com" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body text-sm">Phone</FormLabel>
              <FormControl><Input placeholder="+234 800 123 4567" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="estimatedVolume" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-body text-sm">Estimated Weekly Volume</FormLabel>
            <FormControl><Input placeholder="e.g. 500kg vegetables, 200 fruit boxes" {...field} className="rounded-xl" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-body text-sm">Additional Notes (Optional)</FormLabel>
            <FormControl><Textarea placeholder="Tell us about your business needs..." rows={4} {...field} className="rounded-xl" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <button
          type="submit"
          className="w-full rounded-full bg-accent px-8 py-3.5 font-body text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Submit Inquiry
        </button>
      </form>
    </Form>
  );
};

export default BusinessForm;
