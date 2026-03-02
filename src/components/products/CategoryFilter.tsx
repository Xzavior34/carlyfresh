interface CategoryFilterProps {
  selected: string;
  onSelect: (cat: string) => void;
  search: string;
  onSearch: (val: string) => void;
  categories: string[];
}

const CategoryFilter = ({ selected, onSelect, search, onSearch, categories }: CategoryFilterProps) => {
  return (
    <div className="space-y-6">
      <div>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Categories</h3>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`rounded-xl px-4 py-2 text-left font-body text-sm transition-colors ${
                selected === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;
