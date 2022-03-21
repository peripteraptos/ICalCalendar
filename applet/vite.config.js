import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "../resources",
    lib: {
      entry: path.resolve(__dirname, "src/main.js"),
      name: "CalendarApplet",
      fileName: format => `calendar.${format}.js`
    }
  }
});
