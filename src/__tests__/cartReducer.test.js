// Unit test (Jest only): add-to-cart and remove-from-cart logic
import cartReducer, { addToCart, removeFromCart } from "../store/cartSlice.js";
import { SNEAKERS, SANDALS } from "../test/testData.js";

test("adding a product puts it in the cart, adding it again raises its quantity, removing deletes only that product", () => {
  let state = cartReducer(undefined, { type: "@@init" });
  expect(state.items).toEqual([]);

  state = cartReducer(state, addToCart(SNEAKERS));
  expect(state.items).toEqual([expect.objectContaining({ id: 1, name: "Running Sneakers", quantity: 1 })]);

  state = cartReducer(state, addToCart(SNEAKERS));
  expect(state.items).toHaveLength(1);
  expect(state.items[0].quantity).toBe(2);

  state = cartReducer(state, addToCart(SANDALS));
  expect(state.items.map((i) => i.id)).toEqual([1, 2]);

  state = cartReducer(state, removeFromCart(1));
  expect(state.items.map((i) => i.id)).toEqual([2]);
});
