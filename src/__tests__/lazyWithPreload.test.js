// Unit tests: lazy loading helper (Experiment 2, parts a and b)
import lazyWithPreload from "../utils/lazyWithPreload.js";

const page = { default: () => null };

test("preload starts the import once, however often it is called", async () => {
  const factory = jest.fn(() => Promise.resolve(page));
  const Page = lazyWithPreload(factory);
  expect(factory).not.toHaveBeenCalled(); // nothing is downloaded until needed
  await Promise.all([Page.preload(), Page.preload()]);
  expect(factory).toHaveBeenCalledTimes(1);
});

test("a failed download can be tried again later", async () => {
  const factory = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(page);
  const Page = lazyWithPreload(factory);
  await expect(Page.preload()).rejects.toThrow("offline");
  await expect(Page.preload()).resolves.toBe(page);
  expect(factory).toHaveBeenCalledTimes(2);
});
