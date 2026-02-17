// NOTE: Form submission is currently simulating a 200 OK response.
// TODO: Connect to EmailJS or Backend API.

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/forms/ContactForm";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Green header */}
      <section className="bg-primary pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
              Contact Us
            </h1>
            <p className="mt-3 font-body text-lg text-primary-foreground/70">
              We'd love to hear from you. Get in touch and we'll respond promptly.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl bg-card p-8 shadow-lg">
                <h2 className="mb-6 font-display text-2xl font-bold text-foreground">Send a Message</h2>
                <ContactForm />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">Address</h3>
                    <p className="font-body text-sm text-muted-foreground">52 Ikwere Road, Port Harcourt</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">Phone</h3>
                    <p className="font-body text-sm text-muted-foreground">+234 800 CARLY (22759)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">Email</h3>
                    <p className="font-body text-sm text-muted-foreground">hello@carlyfresh.com</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Clock size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">Operating Hours</h3>
                    <p className="font-body text-sm text-muted-foreground">Mon – Sat: 7:00 AM – 8:00 PM</p>
                    <p className="font-body text-sm text-muted-foreground">Sun: 9:00 AM – 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
