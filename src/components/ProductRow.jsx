import { useState } from "react";
import { validatePrice } from "../utils/validators.js";
import ProductImage from "./ProductImage.jsx";

// One table row. It switches between three modes:
//   view          -> Edit / Price / Delete buttons
//   price         -> quick price change (PATCH, only the price is sent)
//   confirmDelete -> "Delete?  Yes / No" before the DELETE request is made
function ProductRow({ product, busy, locked, onEdit, onPatchPrice, onDelete }) {
  const [mode, setMode] = useState("view");
  const [price, setPrice] = useState(String(product.price));
  const [priceError, setPriceError] = useState("");

  const savePrice = () => {
    const msg = validatePrice(price);
    if (msg) { setPriceError(msg); return; }
    Promise.resolve(onPatchPrice(product.id, Number(price)))
      .then(() => setMode("view"))
      .catch(() => {}); // the error banner is shown by the parent
  };

  const cancelPrice = () => { setMode("view"); setPrice(String(product.price)); setPriceError(""); };
  const btn = "border rounded px-2 py-1 text-xs disabled:opacity-40";

  let actions;
  if (busy) {
    actions = <span className="text-xs text-gray-500" role="status">{busy === "delete" ? "Deleting..." : "Saving..."}</span>;
  } else if (mode === "confirmDelete") {
    actions = (
      <div className="flex items-center gap-1 text-xs">
        <span>Delete?</span>
        <button className={`${btn} bg-red-600 text-white`} onClick={() => { setMode("view"); onDelete(product.id); }}>Yes</button>
        <button className={btn} onClick={() => setMode("view")}>No</button>
      </div>
    );
  } else {
    actions = (
      <div className="flex gap-1">
        <button className={btn} disabled={locked} onClick={() => onEdit(product)}>Edit</button>
        <button className={btn} disabled={locked} onClick={() => setMode("price")}>Price</button>
        <button className={`${btn} text-red-600`} disabled={locked} onClick={() => setMode("confirmDelete")}>Delete</button>
      </div>
    );
  }

  return (
    <tr className="border-t align-top">
      <td className="p-2"><ProductImage src={product.image} alt="" width={40} height={40} className="h-10 w-10 object-contain bg-gray-50 rounded" /></td>
      <td className="p-2 font-medium">{product.name}</td>
      <td className="p-2">{product.category}</td>
      <td className="p-2">{product.brand}</td>
      <td className="p-2 whitespace-nowrap">
        {mode === "price" && !busy ? (
          <div>
            <div className="flex gap-1">
              <input
                type="text" inputMode="decimal" aria-label={`New price for ${product.name}`}
                value={price} onChange={(e) => { setPrice(e.target.value); setPriceError(""); }}
                className={`border rounded p-1 w-20 text-sm ${priceError ? "border-red-500" : ""}`}
              />
              <button className={`${btn} bg-indigo-600 text-white`} onClick={savePrice}>Save</button>
              <button className={btn} onClick={cancelPrice}>Cancel</button>
            </div>
            {priceError && <p className="text-red-500 text-xs mt-1">{priceError}</p>}
          </div>
        ) : (
          <>₹{product.price}</>
        )}
      </td>
      <td className="p-2">{product.rating}★</td>
      <td className="p-2">{actions}</td>
    </tr>
  );
}

export default ProductRow;
