/**
 * Vendor Products — CRUD with Zod validation & loading states
 */

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, PackageOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
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
  image_url: z.string().max(500).optional(),
});

export default function VendorProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "Fresh Produce", price: "", image_url: "", stock_level: "0" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase.from("products").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const toggleStock = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ in_stock: !current }).eq("id", id);
    if (!error) setProducts((prev) => prev.map((p) => p.id === id ? { ...p, in_stock: !current } : p));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", category: "Fresh Produce", price: "", image_url: "", stock_level: "0" });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), image_url: p.image_url || "", stock_level: String(p.stock_level) });
    setErrors({});
    setShowModal(true);
  };

  const save = async () => {
    if (!user) return;
    const parsed = productSchema.safeParse({
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock_level: Number(form.stock_level),
      image_url: form.image_url || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const payload = { name: parsed.data.name, category: parsed.data.category, price: parsed.data.price, stock_level: parsed.data.stock_level, vendor_id: user.id, image_url: form.image_url || null, in_stock: parsed.data.stock_level > 0 };
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
    fetchProducts();
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
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Products</h1>
          <p className="text-muted-foreground font-body text-sm">{products.length} products</p>
        </div>
        <Button size="sm" className="font-body gap-1" onClick={openAdd}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      {products.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <PackageOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">No products yet</h3>
            <p className="font-body text-sm text-muted-foreground max-w-sm mb-6">
              Add your first harvest to start selling on CarlyFresh. Your products will appear here once created.
            </p>
            <Button size="sm" className="font-body gap-1" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => openEdit(item)}
                    >
                      <TableCell className="font-medium font-body text-foreground">{item?.name || "N/A"}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-body text-[11px]">{item?.category || "N/A"}</Badge></TableCell>
                      <TableCell className="text-right font-body tabular-nums">{formatNaira(Number(item?.price ?? 0))}</TableCell>
                      <TableCell className="text-center font-body tabular-nums">{item?.stock_level ?? 0}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item?.in_stock ?? false}
                          onCheckedChange={() => toggleStock(item.id, item.in_stock)}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); del(item.id); }} disabled={deleting === item.id}>
                            {deleting === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-body">Product Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="font-body" />
              {errors.name && <p className="text-xs text-destructive font-body">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-body">Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                <SelectContent>{["Fresh Produce", "Oils & Spices", "Fruits", "Vegetables", "Bundles"].map((c) => (<SelectItem key={c} value={c} className="font-body">{c}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">Price (₦) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="font-body" />
                {errors.price && <p className="text-xs text-destructive font-body">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-body">Stock Level *</Label>
                <Input type="number" min="0" step="1" value={form.stock_level} onChange={(e) => setForm((p) => ({ ...p, stock_level: e.target.value }))} className="font-body" />
                {errors.stock_level && <p className="text-xs text-destructive font-body">{errors.stock_level}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Image URL (optional)</Label>
              <Input value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} className="font-body" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} className="font-body" disabled={saving}>Cancel</Button>
            <Button onClick={save} className="font-body gap-2" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
