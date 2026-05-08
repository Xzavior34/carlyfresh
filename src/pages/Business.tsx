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

const benefits = [
  {
    icon: ShoppingBasket,
    title: "Simplified Procurement",
    desc: "One vetted supply partner replacing dozens of vendor calls and market runs.",
  },
  {
    icon: Snowflake,
    title: "Consistent Freshness",
    desc: "Cold-chain seafood and produce delivered at peak freshness on a fixed schedule.",
  },
  {
    icon: HandCoins,
    title: "Flexible Supply Support",
    desc: "Recurring, on-demand or seasonal supply that flexes with your menu and guest count.",
  },
  {
    icon: LineChart,
    title: "Better Visibility",
    desc: "Live order tracking, transparent pricing and a dedicated business dashboard.",
  },
];

const segments = [
  { icon: UtensilsCrossed, label: "Restaurants" },
  { icon: ChefHat, label: "Caterers" },
  { icon: Hotel, label: "Hotels" },
  { icon: Store, label: "Retail Stores" },
  { icon: Coffee, label: "Cafés" },
  { icon: Cloud, label: "Cloud Kitchens" },
  { icon: Building2, label: "Offices" },
];

const tiers = [
  {
    name: "Starter Business",
    price: "₦50,000",
    cadence: "/month",
    ideal: "Ideal for small vendors & cafés",
    features: [
      "Weekly recurring delivery",
      "Up to 30kg seafood + produce",
      "Standard support (48h)",
      "Single delivery window",
    ],
    cta: "Open Business Account",
    href: "#inquiry",
    highlight: false,
  },
  {
    name: "Growth Business",
    price: "₦200,000",
    cadence: "/month",
    ideal: "Ideal for restaurants & caterers",
    features: [
      "2–3 deliveries per week",
      "Priority cold-chain handling",
      "Dedicated account manager",
      "Custom delivery windows",
      "5% volume discount",
    ],
    cta: "Start with Growth",
    href: "#inquiry",
    highlight: true,
  },
  {
    name: "Enterprise Supply",
    price: "₦500,000",
    cadence: "/month",
    ideal: "Ideal for hotels & large operations",
    features: [
      "Daily deliveries",
      "Multi-site fulfilment",
      "SLA-backed freshness guarantee",
      "Quarterly business review",
      "10% volume discount",
    ],
    cta: "Talk to Enterprise",
    href: "#inquiry",
    highlight: false,
  },
  {
    name: "Custom Business Tier",
    price: "Bespoke",
    cadence: "",
    ideal: "Built around your operation",
    features: [
      "Custom catalogue & pricing",
      "Private cold-chain routes",
      "API & POS integrations",
      "Multi-currency invoicing",
    ],
    cta: "Reach our team",
    href: "/contact",
    highlight: false,
  },
];

const faqs = [
  {
    q: "Do you support recurring weekly or daily deliveries?",
    a: "Yes. Every business plan ships on a fixed cadence you choose — weekly, multiple times per week, or daily for Enterprise — with confirmed delivery windows and live tracking.",
  },
  {
    q: "Can I order seafood and produce in bulk?",
    a: "Absolutely. Bulk seafood (snapper, croaker, prawns, crab, tilapia and more) and farm-fresh produce are sourced from verified suppliers and packed in cold-chain crates sized to your kitchen.",
  },
  {
    q: "Are your suppliers verified?",
    a: "Every farm, fisherman and processor goes through our supplier vetting: cold-chain audits, freshness sampling and reliability scoring. Only suppliers above a 4.5/5 rating stay on the network.",
  },
  {
    q: "Can we get custom pricing for our volume?",
    a: "Yes — Growth and Enterprise tiers include volume discounts, and the Custom Business Tier lets us build pricing entirely around your menu, locations and forecast.",
  },
  {
    q: "What happens if a delivery is delayed or below quality?",
    a: "Our SLA covers replacement or full credit on any item that misses our freshness standard. Business accounts get a same-day resolution promise.",
  },
];

const Business = () => {
  const benefitsRef = useRef<HTMLDivElement>(null);
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-80px" });
  const segmentsRef = useRef<HTMLDivElement>(null);
  const segmentsInView = useInView(segmentsRef, { once: true, margin: "-80px" });
  const pricingRef = useRef<HTMLDivElement>(null);
  const pricingInView = useInView(pricingRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(149_60%_18%)] pt-32 pb-24">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--primary-foreground)) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="container relative mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-accent">
              CarlyFresh for Business
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-primary-foreground sm:text-5xl md:text-6xl">
              Fresh Food Supply made for serious Food Businesses
            </h1>
            <p className="mt-6 max-w-2xl font-body text-base text-primary-foreground/75 sm:text-lg">
              Source premium seafood, farm-fresh produce and cold-chain staples on a schedule
              you control. Cut sourcing stress, stabilise costs and run a kitchen that never
              runs out.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
              >
                <a href="#inquiry">Open Business Account <ArrowRight className="ml-1 h-4 w-4" /></a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/contact">Request Supply Consultation</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-body text-sm text-primary-foreground/70">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Verified suppliers</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Cold-chain delivery</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> SLA-backed freshness</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHY USE US */}
      <section ref={benefitsRef} className="py-20 sm:py-28">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-accent">Why use us</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Built for kitchens that can’t afford to run out
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-accent/15 group-hover:text-accent">
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
      <section ref={segmentsRef} className="bg-secondary py-20 sm:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-accent">Segments served</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Trusted across the food industry
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {segments.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={segmentsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon size={22} />
                </div>
                <span className="font-body text-sm font-medium text-foreground">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section ref={pricingRef} className="py-20 sm:py-28">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-accent">Business pricing</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Transparent monthly tiers
            </h2>
            <p className="mt-3 font-body text-muted-foreground">
              Pick the plan that matches your volume. Upgrade, downgrade or go custom anytime.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-3xl border p-7 shadow-sm transition-all hover:shadow-xl ${
                  t.highlight
                    ? "border-accent bg-card ring-2 ring-accent/40"
                    : "border-border bg-card"
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-accent-foreground shadow">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold text-foreground">{t.name}</h3>
                <p className="mt-1 font-body text-sm text-muted-foreground">{t.ideal}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">{t.price}</span>
                  {t.cadence && <span className="font-body text-sm text-muted-foreground">{t.cadence}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-body text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`mt-7 w-full ${
                    t.highlight
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {t.href.startsWith("#") ? <a href={t.href}>{t.cta}</a> : <Link to={t.href}>{t.cta}</Link>}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary py-20 sm:py-24">
        <div className="container mx-auto max-w-3xl px-6 lg:px-12">
          <div className="mb-10 text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-accent">FAQ</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">Common questions</h2>
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
              Ready to stabilise your supply?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-primary-foreground/75">
              Tell us your volume and cadence — we'll send a tailored quote within 24 hours.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/contact">Open Business Account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
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
