// NOTE: Form submission is currently simulating a 200 OK response.
// TODO: Connect to EmailJS or Backend API.

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/forms/ContactForm";

const Contact = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const contentInView = useInView(contentRef, { once: true, margin: "-80px" });

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
            <h1 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl md:text-5xl">
              Contact Us
            </h1>
            <p className="mt-3 font-body text-base text-primary-foreground/70 sm:text-lg">
              We'd love to hear from you. Get in touch and we'll respond promptly.
            </p>
          </motion.div>
        </div>
      </section>

      <section ref={contentRef} className="py-16 sm:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid gap-10 sm:gap-12 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={contentInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="rounded-3xl bg-card p-6 sm:p-8 shadow-lg">
                <h2 className="mb-6 font-display text-xl sm:text-2xl font-bold text-foreground">Send a Message</h2>
                <ContactForm />
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={contentInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="space-y-6 sm:space-y-8">
                {[
                  { icon: MapPin, title: "Address", text: "52 Ikwere Road, Port Harcourt" },
                  { icon: Phone, title: "Phone", text: "+234 800 CARLY (22759)" },
                  { icon: Mail, title: "Email", text: "hello@carlyfresh.com" },
                  { icon: Instagram, title: "Instagram", text: "@Carlyfresh5", link: "https://instagram.com/carlyfresh5" },
                ].map((item, i) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="font-body text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
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
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
