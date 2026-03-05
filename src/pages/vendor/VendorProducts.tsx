import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

type Product = Tables<"products">;

export default function VendorProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "Fresh Produce", price: "", image_url: "", stock_level: "0" });

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
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), image_url: p.image_url || "", stock_level: String(p.stock_level) });
    setShowModal(true);
  };

  const save = async () => {
    if (!user) return;
    const payload = { name: form.name, category: form.category, price: Number(form.price), vendor_id: user.id, image_url: form.image_url || null, stock_level: Number(form.stock_level), in_stock: Number(form.stock_level) > 0 };
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product updated" });
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product added" });
    }
    setShowModal(false);
    fetchProducts();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Product deleted" });
  };

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading products…</p>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Products</h1>
          <p className="text-muted-foreground font-body text-sm">{products.length} products</p>
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
                {products.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium font-body text-foreground">{item.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-body text-[11px]">{item.category}</Badge></TableCell>
                    <TableCell className="text-right font-body tabular-nums">{formatNaira(Number(item.price))}</TableCell>
                    <TableCell className="text-center font-body tabular-nums">{item.stock_level}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={item.in_stock} onCheckedChange={() => toggleStock(item.id, item.in_stock)} className="data-[state=checked]:bg-primary" />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-body">No products yet. Add your first product!</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label className="font-body">Product Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="font-body" /></div>
            <div className="space-y-2">
              <Label className="font-body">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                <SelectContent>{["Fresh Produce", "Oils & Spices", "Fruits", "Vegetables", "Bundles"].map((c) => (<SelectItem key={c} value={c} className="font-body">{c}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-body">Price (₦)</Label><Input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="font-body" /></div>
              <div className="space-y-2"><Label className="font-body">Stock Level</Label><Input type="number" value={form.stock_level} onChange={(e) => setForm((p) => ({ ...p, stock_level: e.target.value }))} className="font-body" /></div>
            </div>
            <div className="space-y-2"><Label className="font-body">Image URL (optional)</Label><Input value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} className="font-body" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} className="font-body">Cancel</Button>
            <Button onClick={save} className="font-body">{editing ? "Save Changes" : "Add Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
