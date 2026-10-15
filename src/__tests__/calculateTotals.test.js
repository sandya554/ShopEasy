// Unit test (Jest only): total calculation (subtotal, discount, delivery)
import { calculateTotals } from "../store/cartSlice.js";

test("totals follow the discount and delivery rules at each price band", () => {
  // empty cart: nothing to pay, no delivery charge
  expect(calculateTotals([])).toEqual({ subtotal: 0, discount: 0, delivery: 0, total: 0 });
  // up to ₹2000: no discount, ₹19 delivery (₹2000 exactly is still this band)
  expect(calculateTotals([{ price: 499, quantity: 2 }])).toEqual({ subtotal: 998, discount: 0, delivery: 19, total: 1017 });
  expect(calculateTotals([{ price: 1000, quantity: 2 }])).toEqual({ subtotal: 2000, discount: 0, delivery: 19, total: 2019 });
  // above ₹2000: ₹150 off, ₹39 delivery
  expect(calculateTotals([{ price: 1499, quantity: 2 }])).toEqual({ subtotal: 2998, discount: 150, delivery: 39, total: 2887 });
  // above ₹3000: ₹300 off, ₹59 delivery
  expect(calculateTotals([{ price: 2999, quantity: 2 }])).toEqual({ subtotal: 5998, discount: 300, delivery: 59, total: 5757 });
  // price x quantity added up over several products
  expect(calculateTotals([{ price: 1499, quantity: 1 }, { price: 149, quantity: 2 }]).subtotal).toBe(1797);
});
