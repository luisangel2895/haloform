import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx"],
    projects: [
      {
        test: {
          name: "core",
          environment: "node",
          include: ["packages/core/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "react",
          environment: "jsdom",
          include: ["packages/react/src/**/*.test.tsx"],
          setupFiles: ["packages/react/src/setup.ts"],
        },
      },
      {
        test: {
          name: "native",
          environment: "node",
          include: ["packages/native/src/**/*.test.ts"],
        },
      },
    ],
  },
});
