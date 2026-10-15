import { useEffect, useRef } from "react";

// (e) Not focused automatically on load (that would pull focus away from the page
// and skip the navigation). Instead the "/" key jumps to the search box.
function SearchBar({ keyword, onSearch }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <input
      ref={inputRef} value={keyword} onChange={(e) => onSearch(e.target.value)}
      placeholder="Search products..." aria-label="Search products" aria-keyshortcuts="/"
      autoComplete="off" maxLength={100} className="border p-2 rounded w-full sm:w-64"
    />
  );
}

export default SearchBar;
