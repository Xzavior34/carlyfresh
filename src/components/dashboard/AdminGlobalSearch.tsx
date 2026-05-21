import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, Package, ShoppingCart, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

type Result =
  | { kind: "product"; id: string; label: string; sub: string }
  | { kind: "order"; id: string; label: string; sub: string }
  | { kind: "user"; id: string; label: string; sub: string };

export default function AdminGlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const orderIdMaybe = /^\d+$/.test(term) ? Number(term) : null;
      const [prodRes, ordRes, profRes] = await Promise.all([
        supabase.from("products").select("id, name, category").ilike("name", `%${term}%`).limit(5),
        orderIdMaybe != null
          ? supabase.from("orders").select("id, order_number, status, total_amount").eq("order_number", orderIdMaybe).limit(5)
          : supabase.from("orders").select("id, order_number, status, total_amount").limit(0),
        supabase.from("profiles").select("user_id, full_name, business_name").or(`full_name.ilike.%${term}%,business_name.ilike.%${term}%`).limit(5),
      ]);
      const out: Result[] = [];
      (prodRes.data || []).forEach((p) => out.push({ kind: "product", id: p.id, label: p.name, sub: p.category }));
      (ordRes.data || []).forEach((o: any) => out.push({ kind: "order", id: o.id, label: `Order #${o.order_number}`, sub: o.status }));
      (profRes.data || []).forEach((u) => out.push({ kind: "user", id: u.user_id, label: u.full_name || "Unnamed", sub: u.business_name || "user" }));
      setResults(out);
      setLoading(false);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // COMPATIBILITY LAYER: Generates secure query string URLs to prevent 404 router breaks
  const linkFor = (r: Result) => {
    if (r.kind === "product") return `/admin/products?search=${encodeURIComponent(r.label)}`;
    if (r.kind === "order") {
       const orderNum = r.label.replace('Order #', '');
       return `/admin/orders?search=${encodeURIComponent(orderNum)}`;
    }
    return `/admin/users?search=${encodeURIComponent(r.label)}`;
  };

  const Icon = ({ kind }: { kind: Result["kind"] }) =>
    kind === "product" ? <Package className="h-4 w-4 text-primary" /> :
    kind === "order" ? <ShoppingCart className="h-4 w-4 text-primary" /> :
    <User className="h-4 w-4 text-primary" />;

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search orders, products, users..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          className="pl-9 font-body h-9 bg-muted/40 transition-all focus-visible:ring-1 focus-visible:ring-primary"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {results.length === 0 && !loading ? (
            <p className="py-6 text-center font-body text-sm text-muted-foreground">No matches found</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    to={linkFor(r)}
                    onClick={() => { setOpen(false); setQ(""); }}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                  >
                    <Icon kind={r.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="font-body font-medium text-foreground truncate">{r.label}</p>
                      <p className="font-body text-xs text-muted-foreground truncate capitalize">{r.kind} · {r.sub}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
