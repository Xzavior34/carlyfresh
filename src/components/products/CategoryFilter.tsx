interface CategoryFilterProps {
  selected: string;
  onSelect: (cat: string) => void;
  search: string;
  onSearch: (val: string) => void;
  categories: string[];
}

const CATEGORY_ICONS: Record<string, string> = {
  All: "🌿",
  "All Categories": "🌿",
  Vegetables: "🥬",
  Fruits: "🍎",
  Tubers: "🥔",
  Tubers_roots: "🥔",
  "Grains & Flours": "🌾",
  "Grains & Staples": "🌾",
  "Meat & Poultry": "🍗",
  Seafood: "🐟",
  "Oils & Spices": "🫒",
  "Oils & Condiments": "🫒",
  Baskets: "🧺",
  Bundles: "🧺",
  Wholesale: "📦",
};

const getCategoryIcon = (name: string): string => {
  if (CATEGORY_ICONS[name]) return CATEGORY_ICONS[name];
  const lower = name.toLowerCase();
  if (lower.includes("veg") || lower.includes("leaf")) return "🥬";
  if (lower.includes("fruit")) return "🍎";
  if (lower.includes("tuber") || lower.includes("yam") || lower.includes("potato")) return "🥔";
  if (lower.includes("grain") || lower.includes("rice") || lower.includes("flour")) return "🌾";
  if (lower.includes("meat") || lower.includes("chicken") || lower.includes("beef")) return "🍗";
  if (lower.includes("fish") || lower.includes("sea")) return "🐟";
  if (lower.includes("oil") || lower.includes("spice") || lower.includes("pepper")) return "🌶️";
  if (lower.includes("basket") || lower.includes("bundle")) return "🧺";
  return "🌱";
};

const CategoryFilter = ({ selected, onSelect, search, onSearch, categories }: CategoryFilterProps) => {
  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Filter by name, unit..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-2xl border border-input bg-background/80 backdrop-blur-sm px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
      </div>
      <div>
        <h3 className="mb-3 font-display text-sm font-bold tracking-tight text-foreground flex items-center justify-between">
          <span>Categories</span>
          <span className="font-body text-xs font-normal text-muted-foreground">{categories.length}</span>
        </h3>
        <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
          {categories.map((cat) => {
            const isSelected = selected === cat;
            const icon = getCategoryIcon(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelect(cat)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-left font-body text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                    : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="flex-1 truncate">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;
