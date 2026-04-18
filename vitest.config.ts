import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "mcp-server/src/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "#domain": path.join(rootDir, "src/domain"),
      "#application": path.join(rootDir, "src/application"),
      "#infrastructure": path.join(rootDir, "src/infrastructure"),
      "#boundary": path.join(rootDir, "src/boundary"),
    },
  },
});
