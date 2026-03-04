import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "To Buy", href: "/shop" },
  { label: "To Sell", href: "/business" },
  { label: "Business", href: "/business" },
  { label: "Support", href: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, role } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-card/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4 lg:px-12">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-primary">
            CarlyFresh
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`font-body text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.href ? "text-primary" : "text-foreground/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to={`/dashboard/${role || "buyer"}`}
                className="hidden font-body text-sm font-medium text-foreground/70 transition-colors hover:text-primary md:flex items-center gap-1.5"
              >
                <User size={16} />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden font-body text-sm font-medium text-foreground/70 transition-colors hover:text-primary md:block"
              >
                Login
              </Link>
            )}
            <Link to="/shop" className="relative p-2 text-foreground/70 transition-colors hover:text-primary">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>
            <button
              className="p-2 text-foreground/70 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-card"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <span className="font-display text-2xl font-bold text-primary">CarlyFresh</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-foreground/70">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-6 px-6 pt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="font-display text-3xl font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Link
                  to={`/dashboard/${role || "buyer"}`}
                  className="font-display text-3xl font-semibold text-foreground transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="font-display text-3xl font-semibold text-foreground transition-colors hover:text-primary"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
