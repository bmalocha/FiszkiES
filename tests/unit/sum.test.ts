import { describe, it, expect } from "vitest";
import { sum } from "../../src/lib/sum";

describe("sum function", () => {
  it("should return the correct sum of two positive numbers", () => {
    expect(sum(2, 3)).toBe(5);
  });

  it("should return the correct sum with a negative number", () => {
    expect(sum(-1, 5)).toBe(4);
  });

  it("should return the correct sum of two negative numbers", () => {
    expect(sum(-2, -3)).toBe(-5);
  });

  it("should return zero when summing zero and a number", () => {
    expect(sum(0, 7)).toBe(7);
    expect(sum(7, 0)).toBe(7);
  });

  it("should return zero when summing two zeros", () => {
    expect(sum(0, 0)).toBe(0);
  });
});
