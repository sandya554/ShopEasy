import useProducts from "../hooks/useProducts.js";
import SearchBar from "./SearchBar.jsx";
import FilterPanel from "./FilterPanel.jsx";
import ProductList from "./ProductList.jsx";
import Loading from "./Loading.jsx";
import ErrorMessage from "./ErrorMessage.jsx";

function Home() {
  const p = useProducts();

  let content;
  if (p.loading) content = <Loading label="Loading products..." />;
  else if (p.error) content = <ErrorMessage message={p.error} onRetry={p.retry} />;
  else content = <ProductList />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 p-3">
        <SearchBar keyword={p.keyword} onSearch={p.onSearch} />
        <FilterPanel {...p} />
      </div>
      {content}
    </div>
  );
}

export default Home;
