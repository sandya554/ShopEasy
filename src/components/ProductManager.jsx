import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadProducts, loadCategories, addProduct, editProduct, changeProduct, removeProduct, clearMutation,
} from "../store/productsSlice.js";
import ProductForm from "./ProductForm.jsx";
import ProductRow from "./ProductRow.jsx";
import Loading from "./Loading.jsx";
import ErrorMessage from "./ErrorMessage.jsx";
import Button from "./Button.jsx";

// Product CRUD page (route: /admin/products, admin only)
//   Create -> "Add product" form        (POST)
//   Read   -> table on this page        (GET)
//   Update -> "Edit" form / "Price"     (PUT / PATCH)
//   Delete -> "Delete" with confirmation (DELETE)
function ProductManager() {
  const dispatch = useDispatch();
  const { items, categories, status, error, mutation } = useSelector((s) => s.products);
  const [editing, setEditing] = useState(null); // null | "new" | product being edited
  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  // GET: load the full product list (and categories for the form's suggestions)
  useEffect(() => {
    const list = dispatch(loadProducts({ q: "", category: "All" }));
    const cats = dispatch(loadCategories());
    return () => { list.abort(); cats.abort(); dispatch(clearMutation()); };
  }, [dispatch, reloadKey]);

  // Hide the green "saved" message after a few seconds
  useEffect(() => {
    if (mutation.status !== "succeeded") return;
    const t = setTimeout(() => dispatch(clearMutation()), 4000);
    return () => clearTimeout(t);
  }, [mutation, dispatch]);

  const working = mutation.status === "loading";
  const formAction = editing === "new" ? "add" : "edit";
  const formSaving = working && mutation.action === formAction;
  const formError = mutation.status === "failed" && mutation.action === formAction && editing ? mutation.error : "";
  const bannerError = mutation.status === "failed" && (mutation.action === "patch" || mutation.action === "delete") ? mutation.error : "";

  // The thunks return promises; unwrap() lets us run code only when the request succeeded.
  const saveProduct = (values) => {
    const request = editing === "new"
      ? dispatch(addProduct(values))
      : dispatch(editProduct({ id: editing.id, product: values }));
    request.unwrap().then(() => setEditing(null)).catch(() => {}); // on failure the form stays open with the error
  };

  const patchPrice = (id, price) => dispatch(changeProduct({ id, changes: { price } })).unwrap();
  const deleteOne = (id) => { dispatch(removeProduct(id)).unwrap().catch(() => {}); };

  const openForm = (target) => { dispatch(clearMutation()); setEditing(target); };
  const closeForm = () => { dispatch(clearMutation()); setEditing(null); };

  let content;
  if (status === "idle" || status === "loading") content = <Loading label="Loading products..." />;
  else if (status === "failed") content = <ErrorMessage message={error} onRetry={retry} />;
  else if (items.length === 0) content = <p className="p-4 text-center text-gray-500">No products yet. Add your first one.</p>;
  else {
    content = (
      <div className="overflow-x-auto bg-white border rounded">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-2 w-14"><span className="sr-only">Image</span></th>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Brand</th>
              <th className="p-2">Price</th>
              <th className="p-2">Rating</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                busy={working && mutation.id === p.id && mutation.action !== "add" ? mutation.action : ""}
                locked={working || !!editing}
                onEdit={openForm}
                onPatchPrice={patchPrice}
                onDelete={deleteOne}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-3">
      <div className="flex justify-between items-center mb-3">
        <h1 className="font-bold text-xl">Admin: manage products</h1>
        {!editing && status === "succeeded" && <Button onClick={() => openForm("new")}>Add product</Button>}
      </div>

      {mutation.status === "succeeded" && (
        <p className="bg-green-50 border border-green-300 text-green-800 text-sm rounded p-2 mb-3" role="status">{mutation.message}</p>
      )}
      {bannerError && (
        <p className="bg-red-50 border border-red-300 text-red-700 text-sm rounded p-2 mb-3" role="alert">{bannerError}</p>
      )}

      {editing && (
        <ProductForm
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          categories={categories}
          saving={formSaving}
          error={formError}
          onSubmit={saveProduct}
          onCancel={closeForm}
        />
      )}

      {content}
    </div>
  );
}

export default ProductManager;
