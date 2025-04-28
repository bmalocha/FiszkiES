import { defineConfig } from "vitest/config";
import react from "@astrojs/react"; // Assuming you might test React components
import path from "path"; // Import path module

export default defineConfig({
  plugins: [react()], // Add if you test React components directly
  test: {
    globals: true, // Optional: Make vitest APIs global like jest
    environment: "jsdom", // Use jsdom for DOM simulation
    setupFiles: ["tests/setup.ts"], // Path to setup file
    include: ["tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], // Updated pattern
    // Optional: Configure coverage according to vitest-unit.mdc
    // coverage: {
    //   provider: 'v8', // or 'istanbul'
    //   reporter: ['text', 'json', 'html'],
    //   thresholds: {
    //     lines: 80,
    //     functions: 80,
    //     branches: 80,
    //     statements: 80,
    //   },
    // },
  },
  // Add alias resolution
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
