import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Tests unitarios de la lógica de negocio crítica (sin BD). Ver tests/.
// Config en .mts (ESM) y alias "@/" manual para evitar dependencias solo-ESM.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
