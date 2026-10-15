function FilterPanel({ categories, category, onCategory, brands, brand, onBrand, highestPrice, maxPrice, onMaxPrice, minRating, onMinRating, sort, onSort }) {
  return (
    <div role="group" aria-label="Filter and sort products" className="flex flex-wrap gap-2 items-center">
      <select aria-label="Category" value={category} onChange={(e) => onCategory(e.target.value)} className="border p-2 rounded">
        <option value="All">All Categories</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select aria-label="Brand" value={brand} onChange={(e) => onBrand(e.target.value)} className="border p-2 rounded">
        <option value="All">All Brands</option>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>

      <select aria-label="Minimum rating" value={minRating} onChange={(e) => onMinRating(Number(e.target.value))} className="border p-2 rounded">
        <option value={0}>All Ratings</option>
        <option value={4}>4★ &amp; up</option>
        <option value={3}>3★ &amp; up</option>
        <option value={2}>2★ &amp; up</option>
      </select>

      <label className="flex items-center gap-2 text-sm border rounded px-2 py-1">
        Max ₹{maxPrice}
        <input type="range" min="0" max={highestPrice || 0} value={maxPrice} aria-valuetext={`Up to ₹${maxPrice}`} onChange={(e) => onMaxPrice(Number(e.target.value))} />
      </label>

      <select aria-label="Sort by" value={sort} onChange={(e) => onSort(e.target.value)} className="border p-2 rounded">
        <option value="none">Sort</option>
        <option value="low-high">Price: Low-High</option>
        <option value="high-low">Price: High-Low</option>
      </select>
    </div>
  );
}

export default FilterPanel;
