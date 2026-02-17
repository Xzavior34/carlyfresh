// NOTE: Form submission is currently simulating a 200 OK response.
// TODO: Connect to EmailJS or Backend API.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().min(1, "Message is required").max(1000),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const ContactForm = () => {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { firstName: "", lastName: "", email: "", message: "" },
  });

  const onSubmit = (_data: ContactFormValues) => {
    // TODO: Send to backend API
    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours.",
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-sm text-foreground">First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Mabel" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-sm text-foreground">Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Okonkwo" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body text-sm text-foreground">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="mabel@example.com" {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body text-sm text-foreground">Message</FormLabel>
              <FormControl>
                <Textarea placeholder="How can we help you?" rows={5} {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button
          type="submit"
          className="w-full rounded-full bg-primary px-8 py-3.5 font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Send Message
        </button>
      </form>
    </Form>
  );
};

export default ContactForm;
