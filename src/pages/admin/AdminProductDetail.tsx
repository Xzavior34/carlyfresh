import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, Loader2 } from "lucide-react";

export default function AdminProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data) setProduct(data);
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10 text-center font-body text-xl text-muted-foreground">
        Product not found
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto font-body animate-in fade-in duration-300">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
      </button>
      
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{product.name}</h1>
            <p className="text-muted-foreground capitalize">{product.category}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-muted/40 rounded-lg">
            <p className="text-muted-foreground mb-1">Price</p>
            <p className="font-medium text-lg">₦{product.price}</p>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg">
            <p className="text-muted-foreground mb-1">Status</p>
            <p className="font-medium capitalize">{product.status || 'Active'}</p>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg col-span-2">
            <p className="text-muted-foreground mb-1">Description</p>
            <p className="font-medium leading-relaxed">
              {product.description || 'No description provided for this item.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
