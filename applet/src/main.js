import { createApp } from "vue";
import App from "./App.vue";
import linkify from "vue-linkify";

Vue.directive("linkified", linkify);

createApp(App).mount("#vue-root");
