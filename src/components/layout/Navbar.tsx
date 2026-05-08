import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import NotificationPopover from "@/components/notifications/NotificationPopover";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Business", href: "/business" },
  { label: "Blog", href: "/blog" },
  { label: "Support", href: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "seller") return "/vendor";
    if (role === "driver") return "/driver";
    return "/orders";
  };

  const getDashboardLabel = () => {
    if (role === "admin") return "Admin Panel";
    if (role === "seller") return "Vendor Portal";
    if (role === "driver") return "Driver Portal";
    return "My Orders";
  };

  const isHomepage = location.pathname === "/";
  const useLight = isHomepage && !scrolled;

  const textClass = useLight
    ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
    : "text-foreground/70";
  const activeClass = useLight
    ? "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
    : "text-primary";
  const hoverClass = useLight
    ? "hover:text-white/90"
    : "hover:text-primary";

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || !isHomepage
            ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4 lg:px-12">
          <Link to="/" className={`font-display text-2xl font-bold tracking-tight transition-colors duration-300 ${useLight ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : "text-primary"}`}>
            CarlyFresh
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`font-body text-sm font-medium transition-colors ${
                  location.pathname === link.href ? activeClass : `${textClass} ${hoverClass}`
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to={getDashboardLink()} className={`hidden font-body text-sm font-medium transition-colors md:flex items-center gap-1.5 ${textClass} ${hoverClass}`}>
                  <User size={16} />
                  {getDashboardLabel()}
                </Link>
                <button onClick={signOut} className={`hidden md:flex font-body text-sm font-medium transition-colors items-center gap-1.5 ${useLight ? "text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] hover:text-red-300" : "text-foreground/70 hover:text-destructive"}`}>
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" className={`hidden font-body text-sm font-medium transition-colors md:block ${textClass} ${hoverClass}`}>
                Login
              </Link>
            )}
            {user && <NotificationPopover className={`${textClass} ${hoverClass}`} />}
            <Link to="/cart" className={`relative p-2 transition-colors ${textClass} ${hoverClass}`}>
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {itemCount}
                </motion.span>
              )}
            </Link>
            <button className={`p-2 md:hidden ${textClass}`} onClick={() => setMobileOpen(true)}><Menu size={24} /></button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[60] bg-card">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="font-display text-2xl font-bold text-primary">CarlyFresh</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-foreground/70"><X size={24} /></button>
            </div>
            <div className="flex flex-col gap-6 px-6 pt-8">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} className="font-display text-3xl font-semibold text-foreground transition-colors hover:text-primary">{link.label}</Link>
              ))}
              {user ? (
                <>
                  <Link to={getDashboardLink()} className="font-display text-3xl font-semibold text-foreground transition-colors hover:text-primary">{getDashboardLabel()}</Link>
                  <button onClick={signOut} className="font-display text-3xl font-semibold text-destructive text-left">Sign Out</button>
                </>
              ) : (
                <Link to="/login" className="font-display text-3xl font-semibold text-foreground transition-colors hover:text-primary">Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
