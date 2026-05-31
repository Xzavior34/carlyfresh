import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Smartphone, ShieldCheck, Zap, Laptop } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const AppDownloadBanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [qrUrl, setQrUrl] = useState("https://carlyfresh.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}?install=true`);
    }
  }, []);

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
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
                <span>PWA Mobile App Access</span>
              </div>

              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                Install CarlyFresh as <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  a PWA Web App
                </span>
              </h2>

              <p className="font-body text-base text-muted-foreground leading-relaxed max-w-xl">
                Scan the QR code with your mobile camera to open the application instantly. Add it to your home screen to enjoy a native app experience, including faster checkout, offline access to recipes, and push notifications for order updates.
              </p>

              {/* Bullet Features */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Zap size={14} className="fill-accent/20" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground">Instant Installation</h4>
                    <p className="font-body text-xs text-muted-foreground">No App Store or Play Store downloads needed</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <ShieldCheck size={14} className="fill-primary/20" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground">Secure & Lightweight</h4>
                    <p className="font-body text-xs text-muted-foreground">Runs securely directly within your browser sandbox</p>
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
                <div className="relative h-56 w-56 rounded-2xl overflow-hidden bg-white p-2 border border-border">
                  <img
                    src={qrCodeApiUrl}
                    alt={`Scan to install CarlyFresh`}
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
                <span>Scan with camera to install PWA</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppDownloadBanner;
