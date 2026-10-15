import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice.js";
import ProductImage from "./ProductImage.jsx";

// (c) memo + talking to the store directly (not through useCart): a card is only
// re-rendered when its own product changes, not on every cart / filter update.
function ProductCard({ product, priority = false }) {
  const dispatch = useDispatch();
  const onAdd = useCallback(() => dispatch(addToCart(product)), [dispatch, product]);
  const titleId = `product-title-${product.id}`;

  return (
    <article className="border rounded p-2 bg-white [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
      <ProductImage src={product.image} alt={product.name} priority={priority} className="w-full h-52 object-contain bg-gray-50 rounded" />
      <h3 id={titleId} className="font-semibold text-sm">{product.name}</h3>
      <p className="text-xs text-gray-500">{product.brand} · {product.rating}★</p>
      <p className="text-indigo-600 font-bold">₹{product.price}</p>
      <div className="flex gap-1 mt-1">
        {/* (e) aria-describedby adds the product name to "View" / "Add" without changing their names */}
        <Link to={`/products/${product.id}`} aria-describedby={titleId} className="flex-1 border rounded text-sm text-center py-2">View</Link>
        <button onClick={onAdd} aria-describedby={titleId} className="flex-1 bg-indigo-600 text-white rounded text-sm py-2">Add</button>
      </div>
    </article>
  );
}

export default memo(ProductCard);
