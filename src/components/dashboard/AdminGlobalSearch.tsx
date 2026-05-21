import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminGlobalSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the page from refreshing
    
    if (q.trim()) {
      // Navigates directly to the products page and passes the typed text to the URL filter
      navigate(`/admin/products?search=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 font-body h-9 bg-muted/40 transition-all focus-visible:ring-1 focus-visible:ring-primary"
        />
      </div>
    </form>
  );
}
