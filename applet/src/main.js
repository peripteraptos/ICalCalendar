import { createApp } from "vue";
import App from "./App.vue";
import linkifyHtml from "linkify-html";

const app = createApp(App);

app.mount("#vue-root");

app.directive("linkify", {
  beforeMount(el, binding, vnode) {
    el.innerHTML = linkifyHtml(el.innerHTML);
  }
});
