import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import replace from "vite-plugin-filter-replace";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    replace([
      {
        filter: /\.vue$/,
        replace: {
          from: /module.exports = exports =/g,
          to: "export default"
        }
      }
    ]),
    vue()
  ]
});
