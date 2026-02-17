import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer id="footer" className="border-t border-border bg-card py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Leaf size={22} className="text-primary" />
              <span className="font-display text-xl font-bold text-foreground">CarlyFresh</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              Farm-to-table freshness, delivered with care. Built for transparency.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Shop</h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li><a href="#bundles" className="transition-colors hover:text-primary">Bundles</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-primary">Premium</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Gift Cards</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-primary">About Us</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Careers</a></li>
              <li><a href="#tosell" className="transition-colors hover:text-primary">Partner</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-primary">Help Center</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Contact</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Privacy Policy</a></li>
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
