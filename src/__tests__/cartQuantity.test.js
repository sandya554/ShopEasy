// Unit test (Jest only): quantity modification
import cartReducer, { updateQuantity, selectCartCount } from "../store/cartSlice.js";
import { SNEAKERS, SANDALS } from "../test/testData.js";

test("updateQuantity sets the quantity, a quantity below 1 removes the item, and other items are untouched", () => {
  const start = { items: [{ ...SNEAKERS, quantity: 1 }, { ...SANDALS, quantity: 1 }], error: "" };

  let state = cartReducer(start, updateQuantity({ id: 1, quantity: 5 }));
  expect(state.items.map((i) => i.quantity)).toEqual([5, 1]);
  expect(selectCartCount({ cart: state })).toBe(6);

  expect(cartReducer(state, updateQuantity({ id: 42, quantity: 3 })).items).toEqual(state.items); // unknown id: no change

  state = cartReducer(state, updateQuantity({ id: 1, quantity: 0 }));
  expect(state.items.map((i) => i.id)).toEqual([2]);
});
