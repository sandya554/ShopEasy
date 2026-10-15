import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadProductById } from "../store/productsSlice.js";
import useCart from "../hooks/useCart.js";
import Loading from "./Loading.jsx";
import ErrorMessage from "./ErrorMessage.jsx";
import ProductImage from "./ProductImage.jsx";
import { isValidId } from "../utils/sanitize.js";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToCart, cartItems } = useCart();
  const { product, status, error } = useSelector((s) => s.products.selected);
  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  // A new request is made each time the :id in the URL changes.
  // (f) The id comes from the URL, so it is checked before it is used in an API path.
  const validId = isValidId(id);
  useEffect(() => {
    if (!validId) return undefined;
    const req = dispatch(loadProductById(id));
    return () => req.abort();
  }, [dispatch, id, validId, reloadKey]);

  if (!validId) {
    return (
      <div className="max-w-sm mx-auto p-4 text-center">
        <ErrorMessage message="Product not found" />
        <Link to="/products" className="text-indigo-600 underline text-sm">Back to products</Link>
      </div>
    );
  }

  if (status === "idle" || status === "loading") return <Loading label="Loading product..." />;

  if (error || !product) {
    return (
      <div className="max-w-sm mx-auto p-4 text-center">
        <ErrorMessage message={error || "Product not found"} onRetry={error ? retry : undefined} />
        <Link to="/products" className="text-indigo-600 underline text-sm">Back to products</Link>
      </div>
    );
  }

  const inCart = cartItems.find((i) => i.id === product.id)?.quantity || 0;

  return (
    <div className="max-w-sm mx-auto p-4">
      <button onClick={() => navigate(-1)} className="text-indigo-600 underline text-sm mb-2">← Back</button>
      <div className="bg-white rounded p-4 border">
        <ProductImage src={product.image} alt={product.name} width={384} height={256} priority className="w-full h-64 object-contain bg-gray-50 rounded" />
        <h1 className="font-bold text-lg mt-2">{product.name}</h1>
        <p className="text-gray-500">{product.category} · {product.brand} · {product.rating}★</p>

        <p className="text-indigo-600 font-bold mt-2">₹{product.price}</p>

        <button
          onClick={() => addToCart(product)}
          className="bg-indigo-600 text-white w-full rounded p-2 mt-2"
        >
          Add to Cart{inCart > 0 && ` (${inCart} in cart)`}
        </button>
        {inCart > 0 && (
          <Link to="/cart" className="block text-center text-indigo-600 underline text-sm mt-2">Go to cart</Link>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
