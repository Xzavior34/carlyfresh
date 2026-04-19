import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BrandLogo size={22} />
              <span className="font-display text-xl font-bold text-foreground">CarlyFresh</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              Farm-to-table freshness, delivered with care. Built for transparency.
            </p>
            <p className="mt-3 font-body text-xs text-muted-foreground">
              52 Ikwere Road, Port Harcourt
            </p>
            <a
              href="https://instagram.com/carlyfresh5"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Instagram size={18} />
              @Carlyfresh5
            </a>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Shop</h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li><Link to="/shop" className="transition-colors hover:text-primary">Buy</Link></li>
              <li><Link to="/pricing" className="transition-colors hover:text-primary">Premium</Link></li>
              <li><Link to="/shop" className="transition-colors hover:text-primary">Gift Cards</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li><Link to="/about" className="transition-colors hover:text-primary">About Us</Link></li>
              <li><Link to="/business" className="transition-colors hover:text-primary">Work With Us</Link></li>
              <li><Link to="/business" className="transition-colors hover:text-primary">Partner</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li><Link to="/contact" className="transition-colors hover:text-primary">Help Center</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-primary">Contact</Link></li>
              <li><Link to="/about" className="transition-colors hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/about" className="transition-colors hover:text-primary">Terms</Link></li>
              <li><Link to="/about" className="transition-colors hover:text-primary">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center font-body text-xs text-muted-foreground">
          © 2026 CarlyFresh. Built for Transparency. — Version 1.0 (Demo)
        </div>
      </div>
    </footer>
  );
};

export default Footer;
