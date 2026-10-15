import { useState } from "react";
import { safeImageUrl } from "../utils/sanitize.js";
import { BASE_URL } from "../utils/baseUrl.js";

export const PLACEHOLDER = `${BASE_URL}placeholder-product.svg`;

// (c) One image component used everywhere a product picture is shown.
//  - lazy loading + async decoding for pictures below the fold
//  - `priority` for the first pictures / the main product photo (loaded early)
//  - width/height reserve space so the page does not jump while loading
//  - only http(s) URLs are used; a broken or unsafe URL shows a placeholder
//  - no Referer header is sent to the image host
function ProductImage({ src, alt, className = "", width = 208, height = 208, priority = false }) {
  const [failed, setFailed] = useState(false);
  const url = failed ? PLACEHOLDER : safeImageUrl(src) || PLACEHOLDER;

  return (
    <img
      src={url}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchpriority: "high" } : {})}
      referrerPolicy="no-referrer"
      onError={() => { if (!failed) setFailed(true); }}
      className={className}
    />
  );
}

export default ProductImage;
