import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "../store/cartSlice.js";
import productsReducer from "../store/productsSlice.js";

// A fresh Redux store for every test, so tests never affect each other.
// `preloadedState` lets a test start with items already in the cart, products loaded, etc.
export function makeStore(preloadedState) {
  return configureStore({
    reducer: { cart: cartReducer, products: productsReducer },
    preloadedState,
  });
}

// Shows the current URL so a test can check where the app navigated to.
function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="location">{pathname}</div>;
}

// Renders a component inside the same providers the real app uses
// (Redux store + router). Extra `routes` are small stand-in pages used to
// check navigation, e.g. { "/checkout": <p>Checkout page</p> }.
export function renderWithProviders(ui, { preloadedState, store = makeStore(preloadedState), route = "/", path = "*", routes = {} } = {}) {
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LocationProbe />
        <Routes>
          <Route path={path} element={ui} />
          {Object.entries(routes).map(([p, el]) => <Route key={p} path={p} element={el} />)}
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { store, ...result };
}

// Builds a cart item (product + quantity) for preloadedState.
export const cartItem = (product, quantity = 1) => ({ ...product, quantity });
