import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // @vestwise/brand is linked from the workspace: its hooks must see the
    // same React as the package
    dedupe: ["react", "react-dom"],
  },
  test: {
    globals: true,
  },
})
