import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import {
  fetchProducts, fetchCategories, fetchProductById,
  createProduct, updateProduct, patchProduct, deleteProduct,
  getErrorMessage,
} from "../services/productApi.js";

// ---- Async thunks (loading / error handling lives in the extraReducers) ----
export const loadProducts = createAsyncThunk(
  "products/load",
  async ({ q, category }, { signal, rejectWithValue }) => {
    try {
      return await fetchProducts({ q, category, signal });
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const loadCategories = createAsyncThunk(
  "products/loadCategories",
  async (_, { signal, rejectWithValue }) => {
    try {
      return await fetchCategories(signal);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
  {
    // (c) Categories rarely change: once they are in the store, coming back to the
    // products page does not download the whole product list a second time.
    condition: (_, { getState }) => getState().products.categories.length === 0,
  }
);

export const loadProductById = createAsyncThunk(
  "products/loadById",
  async (id, { signal, rejectWithValue }) => {
    try {
      return await fetchProductById(id, signal);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// ---- Write operations (POST / PUT / PATCH / DELETE) ----
export const addProduct = createAsyncThunk(
  "products/add",
  async (product, { rejectWithValue }) => {
    try {
      return await createProduct(product);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const editProduct = createAsyncThunk(
  "products/edit",
  async ({ id, product }, { rejectWithValue }) => {
    try {
      return await updateProduct(id, product);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const changeProduct = createAsyncThunk(
  "products/change",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      return await patchProduct(id, changes);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const removeProduct = createAsyncThunk(
  "products/remove",
  async (id, { rejectWithValue }) => {
    try {
      return await deleteProduct(id);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

const initialState = {
  items: [],
  categories: [],
  status: "idle", // idle | loading | succeeded | failed
  error: "",
  filters: { keyword: "", category: "All", brand: "All", maxPrice: 0, minRating: 0, sort: "none" },
  selected: { product: null, status: "idle", error: "" }, // product detail page
  // Last add / update / delete request: which one, which product, and how it went
  mutation: { status: "idle", action: "", id: null, error: "", message: "" },
};

// Helpers shared by the four write operations
const startMutation = (s, action, id = null) => { s.mutation = { status: "loading", action, id, error: "", message: "" }; };
const finishMutation = (s, message) => { s.mutation = { ...s.mutation, status: "succeeded", error: "", message }; };
const failMutation = (s, a) => {
  s.mutation = { ...s.mutation, status: "failed", message: "", error: a.payload || a.error.message || "Something went wrong." };
};
const rememberCategory = (s, product) => {
  if (product.category && !s.categories.includes(product.category)) s.categories.push(product.category);
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setKeyword: (s, a) => { s.filters.keyword = a.payload; },
    setCategory: (s, a) => { s.filters.category = a.payload; s.filters.brand = "All"; },
    setBrand: (s, a) => { s.filters.brand = a.payload; },
    setMaxPrice: (s, a) => { s.filters.maxPrice = a.payload; },
    setMinRating: (s, a) => { s.filters.minRating = a.payload; },
    setSort: (s, a) => { s.filters.sort = a.payload; },
    clearMutation: (s) => { s.mutation = initialState.mutation; },
  },
  extraReducers: (builder) => {
    builder
      // product list
      // (c) With products already on screen (a new search, or coming back to the page) keep
      // showing them while the fresh list loads, instead of replacing them with a spinner.
      .addCase(loadProducts.pending, (s) => { if (s.items.length === 0) s.status = "loading"; s.error = ""; })
      .addCase(loadProducts.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items = a.payload;
        const highest = a.payload.reduce((m, p) => Math.max(m, p.price), 0);
        if (highest > 0) s.filters.maxPrice = highest;
      })
      .addCase(loadProducts.rejected, (s, a) => {
        if (a.meta.aborted) return; // superseded by a newer request
        s.status = "failed";
        s.items = [];
        s.error = a.payload || a.error.message || "Something went wrong.";
      })
      // categories
      .addCase(loadCategories.fulfilled, (s, a) => { s.categories = a.payload; })
      .addCase(loadCategories.rejected, (s, a) => { if (!a.meta.aborted) s.categories = []; })
      // single product
      .addCase(loadProductById.pending, (s) => { s.selected = { product: null, status: "loading", error: "" }; })
      .addCase(loadProductById.fulfilled, (s, a) => { s.selected = { product: a.payload, status: "succeeded", error: "" }; })
      .addCase(loadProductById.rejected, (s, a) => {
        if (a.meta.aborted) return;
        s.selected = { product: null, status: "failed", error: a.payload || a.error.message || "Something went wrong." };
      })
      // create (POST)
      .addCase(addProduct.pending, (s) => startMutation(s, "add"))
      .addCase(addProduct.fulfilled, (s, a) => {
        s.items.push(a.payload);
        rememberCategory(s, a.payload);
        s.mutation.id = a.payload.id;
        finishMutation(s, `"${a.payload.name}" was added.`);
      })
      .addCase(addProduct.rejected, failMutation)
      // update (PUT)
      .addCase(editProduct.pending, (s, a) => startMutation(s, "edit", a.meta.arg.id))
      .addCase(editProduct.fulfilled, (s, a) => {
        s.items = s.items.map((p) => (p.id === a.payload.id ? a.payload : p));
        rememberCategory(s, a.payload);
        finishMutation(s, `"${a.payload.name}" was updated.`);
      })
      .addCase(editProduct.rejected, failMutation)
      // update (PATCH)
      .addCase(changeProduct.pending, (s, a) => startMutation(s, "patch", a.meta.arg.id))
      .addCase(changeProduct.fulfilled, (s, a) => {
        s.items = s.items.map((p) => (p.id === a.payload.id ? a.payload : p));
        finishMutation(s, `"${a.payload.name}" was updated.`);
      })
      .addCase(changeProduct.rejected, failMutation)
      // delete (DELETE)
      .addCase(removeProduct.pending, (s, a) => startMutation(s, "delete", a.meta.arg))
      .addCase(removeProduct.fulfilled, (s, a) => {
        const gone = s.items.find((p) => p.id === a.payload);
        s.items = s.items.filter((p) => p.id !== a.payload);
        finishMutation(s, `"${gone?.name ?? "Product"}" was deleted.`);
      })
      .addCase(removeProduct.rejected, failMutation);
  },
});

export const { setKeyword, setCategory, setBrand, setMaxPrice, setMinRating, setSort, clearMutation } = productsSlice.actions;

// ---- Selectors ----
export const selectProductItems = (s) => s.products.items;
export const selectFilters = (s) => s.products.filters;
export const selectBrands = createSelector([selectProductItems], (items) => [...new Set(items.map((p) => p.brand))]);
export const selectHighestPrice = createSelector([selectProductItems], (items) =>
  items.reduce((m, p) => Math.max(m, p.price), 0)
);

export const selectVisibleProducts = createSelector(
  [selectProductItems, selectFilters, selectHighestPrice],
  (items, { brand, maxPrice, minRating, sort }, highestPrice) => {
    let list = items
      .filter((p) => brand === "All" || p.brand === brand)
      .filter((p) => p.price <= (maxPrice || highestPrice))
      .filter((p) => p.rating >= minRating);
    if (sort === "low-high") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high-low") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }
);

export default productsSlice.reducer;
