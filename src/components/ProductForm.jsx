import useForm from "../hooks/useForm.js";
import {
  validateProductName, validateCategory, validateBrand,
  validatePrice, validateRating, validateImageUrl,
} from "../utils/validators.js";
import Input from "./Input.jsx";
import Button from "./Button.jsx";

const validate = (v) => {
  const errors = {};
  const checks = {
    name: validateProductName(v.name),
    category: validateCategory(v.category),
    brand: validateBrand(v.brand),
    price: validatePrice(v.price),
    rating: validateRating(v.rating),
    image: validateImageUrl(v.image),
  };
  Object.entries(checks).forEach(([k, msg]) => { if (msg) errors[k] = msg; });
  return errors;
};

// Used for both "Add product" (product = null) and "Edit product".
// The parent gives it a different `key` per product so the fields reset correctly.
function ProductForm({ product, categories, saving, error, onSubmit, onCancel }) {
  const isEdit = !!product;
  const { values, errorFor, handleChange, handleBlur, handleSubmit } = useForm(
    {
      name: product?.name ?? "",
      category: product?.category ?? "",
      brand: product?.brand ?? "",
      price: product ? String(product.price) : "",
      rating: product ? String(product.rating) : "",
      image: product?.image ?? "",
    },
    validate
  );

  const onValid = (v) =>
    onSubmit({
      name: v.name.trim(),
      category: v.category.trim(),
      brand: v.brand.trim(),
      price: Number(v.price),
      rating: Number(v.rating),
      image: v.image.trim(),
    });

  const field = (name, label, extra = {}) => (
    <Input
      label={label} name={name} placeholder={label}
      value={values[name]} onChange={handleChange} onBlur={handleBlur}
      error={errorFor(name)} disabled={saving} {...extra}
    />
  );

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="bg-white rounded p-4 border max-w-xl mx-auto mb-4">
      <h2 className="font-bold text-lg mb-2">{isEdit ? `Edit product #${product.id}` : "Add product"}</h2>
      {field("name", "Product name")}
      <div className="grid grid-cols-2 gap-2">
        {field("category", "Category", { list: "category-options" })}
        {field("brand", "Brand")}
        {field("price", "Price (₹)", { inputMode: "decimal" })}
        {field("rating", "Rating (0-5)", { inputMode: "decimal" })}
      </div>
      <datalist id="category-options">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
      {field("image", "Image URL")}

      {error && <p className="text-red-600 text-sm mt-2" role="alert">{error}</p>}

      <div className="flex gap-2 mt-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Add product"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </form>
  );
}

export default ProductForm;
