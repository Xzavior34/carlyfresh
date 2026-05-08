/**
 * Admin Products — Full CRUD with Zod validation & loading states
 */

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, PackageOpen } from "lucide-react";
import ImageUploadInput from "@/components/products/ImageUploadInput";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

type Product = Tables<"products">;

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  category: z.string().trim().min(1, "Category is required"),
  price: z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative"),
  stock_level: z.number({ invalid_type_error: "Stock must be a number" }).int().min(0, "Stock cannot be negative"),
  vendor_id: z.string().min(1, "Vendor is required"),
  image_url: z.string().max(500).optional(),
  unit_of_measurement: z.string().trim().min(1, "Unit is required"),
  price_per_unit: z.number({ invalid_type_error: "Price per unit must be a number" }).min(0, "Cannot be negative"),
  b2b_price: z.number({ invalid_type_error: "B2B price must be a number" }).min(0, "Cannot be negative").optional(),
});

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "Fresh Produce", price: "", vendor_id: "", image_url: "", stock_level: "0", unit_of_measurement: "piece", price_per_unit: "", b2b_price: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vendors, setVendors] = useState<{ user_id: string; full_name: string | null; business_name: string | null }[]>([]);

  const fetchData = async () => {
    const [prodRes, profRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, business_name"),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (profRes.data) setVendors(profRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", category: "Fresh Produce", price: "", vendor_id: "", image_url: "", stock_level: "0", unit_of_measurement: "piece", price_per_unit: "", b2b_price: "" });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), vendor_id: p.vendor_id, image_url: p.image_url || "", stock_level: String(p.stock_level), unit_of_measurement: (p as any).unit_of_measurement || "piece", price_per_unit: String((p as any).price_per_unit || p.price), b2b_price: (p as any).b2b_price != null ? String((p as any).b2b_price) : "" });
    setErrors({});
    setShowModal(true);
  };

  const save = async () => {
    const parsed = productSchema.safeParse({
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock_level: Number(form.stock_level),
      vendor_id: form.vendor_id,
      image_url: form.image_url || undefined,
      unit_of_measurement: form.unit_of_measurement,
      price_per_unit: Number(form.price_per_unit || form.price),
      b2b_price: form.b2b_price === "" ? undefined : Number(form.b2b_price),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const payload = { name: parsed.data.name, category: parsed.data.category, price: parsed.data.price, stock_level: parsed.data.stock_level, vendor_id: parsed.data.vendor_id, image_url: form.image_url || null, in_stock: parsed.data.stock_level > 0, unit_of_measurement: parsed.data.unit_of_measurement, price_per_unit: parsed.data.price_per_unit, b2b_price: parsed.data.b2b_price ?? null } as any;
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Product updated" });
    } else {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Product added" });
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const del = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setDeleting(null); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Product deleted" });
    setDeleting(null);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">All Products</h1>
          <p className="text-muted-foreground font-body text-xs sm:text-sm">{products.length} products across all vendors</p>
        </div>
        <Button size="sm" className="font-body gap-1" onClick={openAdd}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Product</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Category</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Price</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Stock</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium font-body text-foreground whitespace-nowrap">{item?.name || "N/A"}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-body text-[10px] sm:text-[11px] whitespace-nowrap">{item?.category || "N/A"}</Badge></TableCell>
                    <TableCell className="text-right font-body tabular-nums">{formatNaira(Number(item?.price ?? 0))}</TableCell>
                    <TableCell className="text-center font-body tabular-nums">{item?.stock_level ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] font-body ${item?.in_stock ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {item?.in_stock ? "In Stock" : "Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => del(item.id)} disabled={deleting === item.id}>
                          {deleting === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 sm:py-16">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <PackageOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <p className="text-muted-foreground font-body text-sm">No products yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] max-w-md rounded-xl sm:rounded-lg p-4 sm:p-6">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
          
          {/* INNER SCROLL CONTAINER for mobile stickiness */}
          <div className="space-y-3 sm:space-y-4 py-1 max-h-[65vh] overflow-y-auto px-1">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-body text-sm">Product Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="font-body h-9 sm:h-10" />
              {errors.name && <p className="text-xs text-destructive font-body">{errors.name}</p>}
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-body text-sm">Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="font-body h-9 sm:h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Fresh Produce", "Oils & Spices", "Livestock", "Bulk/Wholesale", "Fruits", "Vegetables", "Bundles"].map((c) => (
                    <SelectItem key={c} value={c} className="font-body">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive font-body">{errors.category}</p>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="font-body text-sm">Price (₦) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="font-body h-9 sm:h-10" />
                {errors.price && <p className="text-xs text-destructive font-body">{errors.price}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="font-body text-sm">Stock Level *</Label>
                <Input type="number" min="0" step="1" value={form.stock_level} onChange={(e) => setForm((p) => ({ ...p, stock_level: e.target.value }))} className="font-body h-9 sm:h-10" />
                {errors.stock_level && <p className="text-xs text-destructive font-body">{errors.stock_level}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="font-body text-sm">Unit of Measurement *</Label>
                <Select value={form.unit_of_measurement} onValueChange={(v) => setForm((p) => ({ ...p, unit_of_measurement: v }))}>
                  <SelectTrigger className="font-body h-9 sm:h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["piece", "kg", "basket", "bunch", "litre", "bag", "crate", "dozen", "s", "l"].map((u) => (
                      <SelectItem key={u} value={u} className="font-body capitalize">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit_of_measurement && <p className="text-xs text-destructive font-body">{errors.unit_of_measurement}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="font-body text-sm">Price per {form.unit_of_measurement} (₦) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price_per_unit} onChange={(e) => setForm((p) => ({ ...p, price_per_unit: e.target.value }))} className="font-body h-9 sm:h-10" placeholder={form.price || "0"} />
                {errors.price_per_unit && <p className="text-xs text-destructive font-body">{errors.price_per_unit}</p>}
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-body text-sm">B2B Wholesale Price (₦) <span className="text-muted-foreground font-normal">— optional</span></Label>
              <Input type="number" min="0" step="0.01" value={form.b2b_price} onChange={(e) => setForm((p) => ({ ...p, b2b_price: e.target.value }))} className="font-body h-9 sm:h-10" placeholder="Leave blank to use regular price" />
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-body">Shown only to flagged B2B customers.</p>
              {errors.b2b_price && <p className="text-xs text-destructive font-body">{errors.b2b_price}</p>}
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="font-body text-sm">Vendor *</Label>
              <Select value={form.vendor_id} onValueChange={(v) => setForm((p) => ({ ...p, vendor_id: v }))}>
                <SelectTrigger className="font-body h-9 sm:h-10"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors?.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id} className="font-body">{s.full_name || s.business_name || s.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendor_id && <p className="text-xs text-destructive font-body">{errors.vendor_id}</p>}
            </div>
            
            <div className="py-1">
              <ImageUploadInput value={form.image_url} onChange={(v) => setForm((p) => ({ ...p, image_url: v }))} />
            </div>
          </div>
          
          <DialogFooter className="pt-2 sm:pt-0">
            <Button variant="outline" onClick={() => setShowModal(false)} className="font-body w-full sm:w-auto h-9 sm:h-10 mb-2 sm:mb-0" disabled={saving}>Cancel</Button>
            <Button onClick={save} className="font-body gap-2 w-full sm:w-auto h-9 sm:h-10" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
