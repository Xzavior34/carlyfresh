import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

/**
 * Premium homepage search bar — navigates to /shop with the query as ?q=
 */
export default function HomeSearchBar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    navigate(`/shop${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <form
      onSubmit={submit}
      className="group relative flex w-full max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white/95 p-1.5 pl-5 shadow-2xl backdrop-blur-md transition-all focus-within:border-accent focus-within:shadow-[0_8px_32px_-4px_rgba(140,185,84,0.4)]"
    >
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search fresh produce, oils, bundles..."
        aria-label="Search products"
        className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none md:text-base"
      />
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-5 font-body text-sm font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Search
      </button>
    </form>
  );
}
