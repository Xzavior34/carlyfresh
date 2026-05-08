import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShoppingBasket,
  Snowflake,
  HandCoins,
  LineChart,
  UtensilsCrossed,
  ChefHat,
  Hotel,
  Store,
  Coffee,
  Cloud,
  Building2,
  Check,
  ArrowRight,
  BellRing,
  Fish,
  ShieldCheck,
  Truck,
  BookOpen,
  Quote
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const updates = [
  "Fresh food stock arrivals",
  "Weekly produce availability",
  "Seasonal sourcing updates",
  "Operational announcements",
  "Bulk supply promotions",
  "New business tools and more",
];

const benefits = [
  {
    icon: ShoppingBasket,
    title: "Simplified Procurement",
    desc: "Manage sourcing more efficiently through centralized ordering, recurring procurement tools, and coordinated fulfillment support.",
  },
  {
    icon: Snowflake,
    title: "Consistent Freshness",
    desc: "Access fresh produce and premium seafood sourced through vetted suppliers.",
  },
  {
    icon: Truck,
    title: "Operational Convenience",
    desc: "Reduce market runs, fragmented supplier communication, and manual coordination.",
  },
  {
    icon: HandCoins,
    title: "Flexible Supply Support",
    desc: "Order on-demand, in bulk, on recurring schedules, or for events and high-volume operations.",
  },
  {
    icon: LineChart,
    title: "Better Visibility & Coordination",
    desc: "Track inventory availability, order history, delivery progress, and procurement records through a business-focused dashboard.",
  },
];

const segments = [
  { icon: UtensilsCrossed, label: "Restaurants & Food Vendors", desc: "Reliable ingredient sourcing for fast-moving kitchens and food operations." },
  { icon: ChefHat, label: "Caterers & Event Kitchens", desc: "Bulk food coordination for events, ceremonies, and high-volume cooking operations." },
  { icon: Hotel, label: "Hotels & Hospitality Brands", desc: "Premium seafood and produce supply tailored for hospitality-grade kitchen standards." },
  { icon: Store, label: "Retail Stores & Food Resellers", desc: "Fresh inventory sourcing for resale and retail distribution." },
  { icon: Coffee, label: "Cafés, Juice Bars & Dessert Brands", desc: "Frequent fresh fruit and ingredient supply for beverage and specialty food businesses." },
  { icon: Cloud, label: "Cloud Kitchens & Delivery Brands", desc: "Scalable ingredient sourcing for modern digital-first food businesses." },
  { icon: Building2, label: "Offices & Corporate Kitchens", desc: "Recurring workplace food and pantry supply coordination." },
];

const pricingFeatures = [
  { name: "Ideal For", starter: "Small vendors & cafés", growth: "Restaurants & caterers", enterprise: "Hotels & large operations", custom: "Specialized business needs" },
  { name: "Ordering Dashboard", starter: "✔", growth: "✔", enterprise: "✔", custom: "✔" },
  { name: "Bulk Ordering Support", starter: "Limited", growth: "✔", enterprise: "✔", custom: "✔" },
  { name: "Scheduled Deliveries", starter: "Optional", growth: "✔", enterprise: "✔", custom: "✔" },
  { name: "Priority Fulfillment", starter: "—", growth: "Limited", enterprise: "✔", custom: "Configurable" },
  { name: "Business Pricing Support", starter: "Standard", growth: "Enhanced", enterprise: "Premium", custom: "Custom" },
  { name: "Dedicated Account Support", starter: "—", growth: "Optional", enterprise: "✔", custom: "✔" },
  { name: "Procurement Coordination", starter: "—", growth: "Basic", enterprise: "Advanced", custom: "Custom" },
  { name: "Seafood Supply Access", starter: "✔", growth: "✔", enterprise: "Priority Access", custom: "Configurable" },
  { name: "Reporting & Insights", starter: "Basic", growth: "Expanded", enterprise: "Advanced", custom: "Custom" },
  { name: "Delivery Flexibility", starter: "Standard", growth: "Flexible", enterprise: "Priority", custom: "Configurable" },
];

const smartTools = [
  { title: "Live Inventory Visibility", desc: "Track available stock and fresh arrivals in real time." },
  { title: "Bulk Order Planning", desc: "Estimate procurement quantities and costs before placing orders." },
  { title: "Seafood Freshness Indicators", desc: "Selected seafood listings include freshness and handling information." },
  { title: "Weekly Supply Scheduling", desc: "Automate recurring ingredient delivery and procurement planning." },
  { title: "Procurement Dashboard", desc: "Manage invoices, order history, recurring orders, saved baskets, and procurement records." },
];

const testimonials = [
  {
    quote: "Carlyfresh makes buying matters more structured and reliable for our kitchen.",
    author: "Kachi",
    role: "Restaurant Operator",
  },
  {
    quote: "The bulk ordering and scheduled delivery from the platform have improved our event operations very much.",
    author: "Blessing",
    role: "Caterer / Event Planner",
  },
  {
    quote: "I like the fresh inventory access and the easier buying arrangements compared to how I did before.",
    author: "Retail Buyer",
    role: "Retail Partner",
  },
];

const faqs = [
  {
    q: "Can businesses schedule recurring deliveries?",
    a: "Yes. Recurring procurement and delivery scheduling are available for business accounts. Send an email or reach out to your account officer for quicker processing.",
  },
  {
    q: "Do you support bulk seafood orders?",
    a: "Yes. Premium seafood is one of our core supply categories.",
  },
  {
    q: "Are suppliers verified?",
    a: "We work with monitored supply partners and structured sourcing coordination. Verification is a mandatory step before suppliers start with us.",
  },
  {
    q: "Can pricing be customized for larger businesses?",
    a: "Yes. Larger and recurring business accounts may qualify for custom pricing support. Please contact your account contact.",
  },
];

const Business = () => {
  const benefitsRef = useRef<HTMLDivElement>(null);
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-80px" });
  const segmentsRef = useRef<HTMLDivElement>(null);
  const segmentsInView = useInView(segmentsRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO SECTION WITH IMAGE BACKGROUND */}
      <section className="relative overflow-hidden pt-32 pb-24">
        {/* Background Image & Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/business-hero.jpg" 
            alt="Fresh food supply for businesses" 
            className="w-full h-full object-cover"
          />
          {/* Black overlay at 60% opacity so text is readable */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="container relative z-10 mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl">
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl md:text-6xl">
              Fresh Food Supply made for serious Food Businesses
            </h1>
            <p className="mt-6 max-w-3xl font-body text-base text-white/90 sm:text-lg">
              Source premium seafood, fresh produce, and kitchen essentials through a streamlined procurement platform designed for forward-thinking restaurants, caterers, hotels, cafés, retailers, and modern food brands.
            </p>
            <p className="mt-4 max-w-3xl font-body text-base text-white/90 sm:text-lg">
              Reduce sourcing stress, improve consistency, and simplify day-to-day food operations with our smarter supply coordination and reliable fulfillment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                <a href="#inquiry">Open Business Account</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-black/20 backdrop-blur-sm text-white hover:bg-white/20">
                <Link to="/contact">Request Supply Consultation</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-body text-sm text-white/80">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Premium seafood supply</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Bulk ordering support</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Scheduled deliveries</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Business procurement dashboard</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Verified supply network</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST STRIP & LIVE UPDATES */}
      <section className="border-b border-border bg-secondary/50 py-6">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
          <div className="flex-1">
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trusted by:</span>
            <p className="mt-2 font-display text-sm font-medium text-foreground sm:text-base">
              Restaurants • Caterers • Hotels • Cafés • Retailers • Cloud Kitchens • Offices
            </p>
          </div>
          <div className="flex-1 border-l-0 lg:border-l border-border lg:pl-8">
            <div className="flex items-center gap-2 mb-2 text-accent">
              <BellRing className="h-5 w-5" />
              <h3 className="font-display font-semibold text-foreground">Fresh Updates & Supply Alerts</h3>
            </div>
            <p className="font-body text-sm text-muted-foreground mb-2">Stay informed with:</p>
            <div className="flex flex-wrap gap-2">
              {updates.map((update, idx) => (
                <span key={idx} className="bg-background border border-border px-3 py-1 rounded-full text-xs text-foreground">
                  {update}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY USE US */}
      <section ref={benefitsRef} className="py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Why Businesses Use Our Platform
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 24 }} animate={benefitsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.08 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon size={22} />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEGMENTS */}
      <section ref={segmentsRef} className="bg-secondary py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Segments We Serve</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {segments.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={segmentsInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.4, delay: i * 0.05 }} className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon size={22} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{s.label}</h3>
                  <p className="font-body text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TABLE & CUSTOM TIER */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Business Account Tiers</h2>
            <p className="mt-3 font-body text-muted-foreground">Flexible Procurement Solutions for Different Business Needs</p>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm mb-16">
            <table className="w-full text-left font-body text-sm border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="p-5 font-display font-semibold text-foreground">Feature</th>
                  <th className="p-5">
                    <div className="font-display font-semibold text-foreground text-base">Starter Business</div>
                    <div className="text-muted-foreground font-normal">Try for free<br/><span className="text-foreground font-medium">50,000/M</span></div>
                  </th>
                  <th className="p-5 bg-accent/5 border-x border-border">
                    <div className="font-display font-semibold text-foreground text-base text-accent">Growth Business</div>
                    <div className="text-muted-foreground font-normal">Try for free<br/><span className="text-foreground font-medium">200,000/m</span></div>
                  </th>
                  <th className="p-5">
                    <div className="font-display font-semibold text-foreground text-base">Enterprise Supply</div>
                    <div className="text-muted-foreground font-normal">Try for free<br/><span className="text-foreground font-medium">500,000/m</span></div>
                  </th>
                  <th className="p-5">
                    <div className="font-display font-semibold text-foreground text-base">Custom Business</div>
                    <div className="text-muted-foreground font-normal"><br/><span className="text-foreground font-medium">Reach our team</span></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingFeatures.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-5 font-medium text-foreground">{row.name}</td>
                    <td className="p-5 text-muted-foreground">{row.starter}</td>
                    <td className="p-5 bg-accent/5 border-x border-border font-medium text-foreground">{row.growth}</td>
                    <td className="p-5 text-muted-foreground">{row.enterprise}</td>
                    <td className="p-5 text-muted-foreground">{row.custom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl bg-secondary p-8 lg:p-12 border border-border flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">Need Something More Flexible?</h3>
              <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold mb-6">Custom Business Tier</div>
              <p className="font-body text-sm text-foreground mb-4 font-semibold">Designed for large:</p>
              <ul className="grid grid-cols-2 gap-2 font-body text-sm text-muted-foreground mb-6">
                <li>• hotel groups</li><li>• franchise operations</li>
                <li>• large caterers</li><li>• retailers</li>
                <li>• institutional kitchens</li><li>• high-volume food operations</li>
              </ul>
            </div>
            <div className="flex-1 bg-card p-6 md:p-8 rounded-2xl border border-border w-full">
              <p className="font-body text-sm text-foreground font-semibold mb-4">Custom Solutions may include:</p>
              <ul className="space-y-3 font-body text-sm text-muted-foreground mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> negotiated pricing structures</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> recurring procurement planning</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> dedicated coordination support</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> custom logistics arrangements</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> tailored food sourcing</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> multi-location fulfillment support</li>
              </ul>
              <Button asChild className="w-full bg-foreground text-background hover:bg-foreground/90">
                <Link to="/contact">Request Custom Business Plan <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SMART PROCUREMENT TOOLS */}
      <section className="bg-secondary/30 py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Smart Procurement Tools</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {smartTools.map((tool, idx) => (
              <div key={idx} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="font-display font-semibold text-foreground mb-2">{tool.title}</h3>
                <p className="font-body text-sm text-muted-foreground">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM SEAFOOD & VERIFIED SUPPLIER */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-12 space-y-20">
          
          {/* SEAFOOD WITH REAL IMAGE */}
          <div className="flex flex-col lg:flex-row items-center gap-12 bg-primary/5 rounded-3xl p-8 lg:p-12 border border-primary/10">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-primary mb-4"><Fish className="h-6 w-6" /><h3 className="font-display text-xl font-bold">Premium Seafood Section</h3></div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">Premium Seafood for Modern Kitchens</h2>
              <p className="font-body text-muted-foreground mb-6">Fresh seafood sourced through verified supply networks with coordinated handling and fulfillment support.</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body text-sm text-foreground mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Fresh arrivals updates</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Bulk seafood supply</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Selected source visibility</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Freshness-focused handling</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Priority business inventory</li>
              </ul>
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Link to="/shop?category=Seafood">Explore Premium food <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="flex-1 w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
               <img src="/images/premium-seafood.jpg" alt="Premium Seafood" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* SUPPLIER WITH REAL IMAGE */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 bg-secondary/30 rounded-3xl p-8 lg:p-12 border border-border">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-foreground mb-4"><ShieldCheck className="h-6 w-6" /><h3 className="font-display text-xl font-bold">Verified Supplier Network</h3></div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">Transparent Sourcing & Supply Coordination</h2>
              <p className="font-body text-muted-foreground mb-6">We work with monitored farms, fisheries, and food suppliers to support more reliable sourcing and procurement experiences.</p>
              <div className="bg-card p-5 rounded-xl border border-border mb-8">
                <p className="font-body text-sm font-semibold mb-3">For selected products, businesses may view:</p>
                <ul className="grid grid-cols-2 gap-2 font-body text-sm text-muted-foreground">
                  <li>• supplier snippets</li><li>• source details</li>
                  <li>• freshness information</li><li>• handling notes</li>
                </ul>
              </div>
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
                <Link to="/about">Learn About Our Supply Network <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="flex-1 w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
               <img src="/images/verified-supplier.jpg" alt="Verified Supplier Network" className="w-full h-full object-cover" />
            </div>
          </div>

        </div>
      </section>

      {/* DELIVERY & INSIGHTS */}
      <section className="border-y border-border bg-card py-20">
        <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12">
          <div>
             <h2 className="font-display text-2xl font-bold text-foreground mb-4">Coordinated Food Logistics for Businesses</h2>
             <p className="font-body text-muted-foreground mb-6">Our operations system supports:</p>
             <ul className="space-y-3 font-body text-sm text-foreground">
                <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Truck className="h-4 w-4 text-primary" /></span> same-day delivery</li>
                <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Truck className="h-4 w-4 text-primary" /></span> scheduled fulfillment</li>
                <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Truck className="h-4 w-4 text-primary" /></span> multi-supplier coordination</li>
                <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Truck className="h-4 w-4 text-primary" /></span> recurring dispatch support</li>
                <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Truck className="h-4 w-4 text-primary" /></span> bulk order logistics</li>
             </ul>
          </div>
          <div className="bg-secondary rounded-2xl p-8 border border-border">
             <BookOpen className="h-8 w-8 text-accent mb-4" />
             <h2 className="font-display text-2xl font-bold text-foreground mb-4">Food Procurement Insights & Operational Resources</h2>
             <p className="font-body text-sm font-semibold mb-4 text-foreground">Explore:</p>
             <ul className="grid grid-cols-2 gap-3 font-body text-sm text-muted-foreground mb-8">
                <li>• sourcing strategies</li><li>• seafood buying guides</li>
                <li>• operational tips</li><li>• food business trends</li>
                <li>• procurement planning</li><li>• seasonal availability</li>
             </ul>
             <Button asChild variant="outline" className="w-full bg-background">
                <Link to="/blog">Visit Business Insights <ArrowRight className="ml-2 h-4 w-4" /></Link>
             </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">What our partners say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-secondary/50 p-8 rounded-3xl border border-border flex flex-col justify-between">
                <Quote className="h-8 w-8 text-accent/40 mb-6" />
                <p className="font-body text-foreground leading-relaxed mb-8">"{t.quote}"</p>
                <div>
                  <h4 className="font-display font-bold text-foreground">{t.author}</h4>
                  <p className="font-body text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto max-w-3xl px-6 lg:px-12">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">FAQ</h2>
          </div>
          <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6 shadow-sm">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-0">
                <AccordionTrigger className="text-left font-display text-base font-semibold text-foreground hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA / INQUIRY */}
      <section id="inquiry" className="py-20 sm:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-primary to-[hsl(149_60%_18%)] p-10 text-center shadow-2xl sm:p-14">
            <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
              Smarter Food Procurement Starts Here
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-primary-foreground/75">
              Fresh produce. Premium seafood. Coordinated fulfillment for growing food businesses.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/contact">Open Business Account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">Request Supply Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Business;
