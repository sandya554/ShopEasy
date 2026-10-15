import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadProducts, loadCategories,
  setKeyword, setCategory, setBrand, setMaxPrice, setMinRating, setSort,
  selectFilters, selectBrands, selectHighestPrice, selectVisibleProducts,
} from "../store/productsSlice.js";

// Product list state comes from the Redux store; this hook just triggers the
// requests and exposes the same props the Home / FilterPanel components use.
function useProducts() {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.products.status);
  const error = useSelector((s) => s.products.error);
  const categories = useSelector((s) => s.products.categories);
  const filters = useSelector(selectFilters);
  const products = useSelector(selectVisibleProducts);
  const brands = useSelector(selectBrands);
  const highestPrice = useSelector(selectHighestPrice);
  const [reloadKey, setReloadKey] = useState(0);

  // Load categories once (and again on retry)
  useEffect(() => {
    const req = dispatch(loadCategories());
    return () => req.abort();
  }, [dispatch, reloadKey]);

  // Request products when the search text or category changes (debounced)
  useEffect(() => {
    let req;
    const t = setTimeout(() => {
      req = dispatch(loadProducts({ q: filters.keyword, category: filters.category }));
    }, 250);
    return () => { clearTimeout(t); req?.abort(); };
  }, [dispatch, filters.keyword, filters.category, reloadKey]);

  return {
    loading: status === "idle" || status === "loading",
    error, products, categories, brands, highestPrice,
    retry: useCallback(() => setReloadKey((k) => k + 1), []),
    keyword: filters.keyword, onSearch: useCallback((v) => dispatch(setKeyword(v)), [dispatch]),
    category: filters.category, onCategory: useCallback((v) => dispatch(setCategory(v)), [dispatch]),
    brand: filters.brand, onBrand: useCallback((v) => dispatch(setBrand(v)), [dispatch]),
    maxPrice: filters.maxPrice, onMaxPrice: useCallback((v) => dispatch(setMaxPrice(v)), [dispatch]),
    minRating: filters.minRating, onMinRating: useCallback((v) => dispatch(setMinRating(v)), [dispatch]),
    sort: filters.sort, onSort: useCallback((v) => dispatch(setSort(v)), [dispatch]),
  };
}

export default useProducts;
