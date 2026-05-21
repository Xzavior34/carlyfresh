/**
 * Admin Baskets — DYNAMIC RULE-BASED COMPOSITION ENGINE
 */
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, ShoppingBag, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";

export default function AdminBaskets() {
  const [baskets, setBaskets] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState<any>(null);
  
  // New State for Rule-Based Composition
  const [rules, setRules] = useState({
    mandatory_categories: "",
    substitution_logic: "closest_price"
  });

  const fetchBaskets = async () => {
    const { data } = await supabase.from("baskets").select("*");
    setBaskets(data || []);
  };

  useEffect(() => { fetchBaskets(); }, []);

  const openRules = (basket: any) => {
    setSelectedBasket(basket);
    // Load existing rules if available
    const r = basket.composition_rules || {};
    setRules({
      mandatory_categories: r.mandatory_categories?.join(", ") || "",
      substitution_logic: r.substitution_logic || "closest_price"
    });
    setShowRulesModal(true);
  };

  const saveRules = async () => {
    const payload = {
      composition_rules: {
        mandatory_categories: rules.mandatory_categories.split(',').map(c => c.trim()),
        substitution_logic: rules.substitution_logic
      }
    };

    const { error } = await supabase
      .from("baskets")
      .update(payload)
      .eq("id", selectedBasket.id);

    if (error) toast({ title: "Failed to save rules", variant: "destructive" });
    else {
      toast({ title: "Rules updated for dynamic allocation" });
      setShowRulesModal(false);
      fetchBaskets();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dynamic Basket Engine</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {baskets.map((basket) => (
          <Card key={basket.id}>
            <CardHeader>
              <CardTitle>{basket.name}</CardTitle>
              <CardDescription>{basket.description}</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 flex gap-2">
              <Button variant="outline" onClick={() => openRules(basket)}>
                <Settings className="h-4 w-4 mr-2" /> Configure Rules
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Rule Builder Dialog */}
      <Dialog open={showRulesModal} onOpenChange={setShowRulesModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configure Composition Engine</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Label>Mandatory Categories (e.g. protein, dairy, produce)</Label>
            <Input 
              value={rules.mandatory_categories}
              onChange={(e) => setRules({...rules, mandatory_categories: e.target.value})}
            />
            <Label>Substitution Logic</Label>
            <Select 
              value={rules.substitution_logic}
              onValueChange={(v) => setRules({...rules, substitution_logic: v})}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="closest_price">Closest Price</SelectItem>
                <SelectItem value="highest_freshness">Highest Freshness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button onClick={saveRules}>Apply Rules</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
