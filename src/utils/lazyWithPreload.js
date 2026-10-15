import { lazy } from "react";

// React.lazy + a .preload() method.
// The page's code is only downloaded when it is first rendered (code splitting),
// but .preload() lets the app start the download earlier, e.g. while the browser
// is idle or when the user is about to need the page. The import runs only once.
export default function lazyWithPreload(factory) {
  let promise;
  const load = () => {
    if (!promise) {
      promise = factory().catch((err) => {
        promise = undefined; // allow a later attempt if the network failed
        throw err;
      });
    }
    return promise;
  };
  const Component = lazy(load);
  Component.preload = load;
  return Component;
}
