import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import visualizer from "rollup-plugin-visualizer";

export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      visualizer({
        open: true,
        filename: "stats.html",
      }),
    ],
  },
});
