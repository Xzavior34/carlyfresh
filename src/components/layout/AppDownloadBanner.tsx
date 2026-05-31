import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Smartphone, Download, ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const AppDownloadBanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [qrUrl, setQrUrl] = useState("https://carlyfresh.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(window.location.origin);
    }
  }, []);

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    qrUrl
  )}&color=166534&bgcolor=ffffff&qzone=1`;

  return (
    <section ref={ref} className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-10 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-10 right-10 -z-10 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />

      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-primary/10 bg-card p-8 md:p-12 lg:p-16 shadow-xl"
        >
          {/* Glassmorphic border glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />

          <div className="grid gap-12 lg:grid-cols-12 items-center relative z-10">
            {/* Text and Features column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 font-body text-xs font-semibold text-primary">
                <Smartphone size={14} />
                <span>Mobile Optimized Experience</span>
              </div>

              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                Get the Freshness on <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Your Mobile Device
                </span>
              </h2>

              <p className="font-body text-base text-muted-foreground leading-relaxed max-w-xl">
                Scan the QR code with your camera to open CarlyFresh on your smartphone. Add it directly to your home screen as a web app for instant checkouts, exclusive app-only pricing, and live order tracking.
              </p>

              {/* Bullet Features */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Zap size={14} className="fill-accent/20" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground">Faster Checkout</h4>
                    <p className="font-body text-xs text-muted-foreground">Save details for 1-click orders</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <ShieldCheck size={14} className="fill-primary/20" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground">Live Delivery Tracking</h4>
                    <p className="font-body text-xs text-muted-foreground">Real-time driver updates</p>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-4 pt-4">
                {/* App Store button */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-2.5 transition-all hover:bg-muted select-none">
                  <svg className="h-6 w-6 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.73-1.2 1.87-1.05 2.97 1.12.09 2.27-.58 3-1.41z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-body text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Download on the</p>
                    <p className="font-body text-xs font-bold text-foreground -mt-0.5">App Store</p>
                  </div>
                </div>

                {/* Google Play button */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-2.5 transition-all hover:bg-muted select-none">
                  <svg className="h-6 w-6 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 3.22a.75.75 0 0 0-.21.54v16.48c0 .22.08.41.21.54l9.02-9.02-9.02-8.54zm10.15 7.42L18.42 8c.36-.21.58-.6.58-1.02s-.22-.81-.58-1.02l-3.27-1.89-2.9 2.9 2.9 2.9zm-4.32-4.32l2.9-2.9-9.1-5.26c-.34-.2-.77-.2-1.11 0l7.31 8.16zm-7.31 9.28l7.31-8.16-2.9-2.9-4.41 7.46c-.34.2-.77.2-1.11 0l1.11 3.6zm0 0" />
                    <path d="M5.22 3.07l10.36 6-2.73 2.73-7.63-8.73zm8.93 7.15l2.73-2.73 3.12 1.8c.24.14.38.4.38.68s-.14.54-.38.68l-5.85 3.37zm-9.08 1.48l7.63-8.73 2.73 2.73-10.36 6zm0 0" />
                  </svg>
                  <div className="text-left">
                    <p className="font-body text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Get it on</p>
                    <p className="font-body text-xs font-bold text-foreground -mt-0.5">Google Play</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative p-6 rounded-3xl border border-primary/20 bg-background shadow-inner group">
                {/* Glowing border glow effect */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-70 blur-xl group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Scanning Laser Line */}
                <motion.div
                  animate={{
                    top: ["10%", "90%", "10%"]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_10px_2px_rgba(147,197,75,0.7)] z-20 pointer-events-none"
                />

                {/* QR Code Wrapper */}
                <div className="relative h-48 w-48 rounded-2xl overflow-hidden bg-white p-2 border border-border">
                  <img
                    src={qrCodeApiUrl}
                    alt={`Scan to open ${qrUrl}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                  
                  {/* Styled central logo overlay */}
                  <div className="absolute inset-0 m-auto h-12 w-12 rounded-xl bg-white border-2 border-primary/20 p-1 flex items-center justify-center shadow-md">
                    <BrandLogo size={36} className="rounded-lg" />
                  </div>
                </div>

                {/* Frame Corner Accents */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-md" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-md" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-md" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-md" />
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-body text-muted-foreground bg-muted/40 px-3.5 py-1.5 rounded-full border border-border/30">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                <span>Camera scan direct access</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppDownloadBanner;
