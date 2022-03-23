import { createApp } from "vue";
import App from "./App.vue";
import vLinkify from "v-linkify/src/index";

const app = createApp(App);

app.mount("#vue-root");

app.directive("linkify", vLinkify);
