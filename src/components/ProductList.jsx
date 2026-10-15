import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectVisibleProducts } from "../store/productsSlice.js";
import ProductCard from "./ProductCard.jsx";

const PAGE_SIZE = 8; // (c) cards drawn at a time; "Show more" draws the next batch
const EAGER_IMAGES = 4; // the first cards are above the fold, so their pictures load right away

function ProductList() {
  const products = useSelector(selectVisibleProducts);
  const [count, setCount] = useState(PAGE_SIZE);

  // a new search / filter result starts again from the first batch
  useEffect(() => { setCount(PAGE_SIZE); }, [products]);

  if (products.length === 0) return <p className="p-4 text-center">No products found</p>;

  const shown = products.slice(0, count);
  return (
    <section aria-label="Products">
      <p className="sr-only" aria-live="polite">{`Showing ${shown.length} of ${products.length} products`}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
        {shown.map((p, i) => (
          <li key={p.id}><ProductCard product={p} priority={i < EAGER_IMAGES} /></li>
        ))}
      </ul>
      {shown.length < products.length && (
        <div className="text-center pb-3">
          <button onClick={() => setCount((c) => c + PAGE_SIZE)} className="border rounded px-4 py-2 text-sm bg-white">
            Show more ({products.length - shown.length} left)
          </button>
        </div>
      )}
    </section>
  );
}

export default ProductList;
