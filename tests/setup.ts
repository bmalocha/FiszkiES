import { vi } from "vitest";
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Global mocks or setup can go here
// Example:
// vi.mock('some-module', () => ({
//   default: vi.fn(),
// }));

// Extend Vitest's expect method with DOM matchers
expect.extend(matchers);
