/**
 * This file is the entry point for our Vue.js application. Here we are
 * concerned with initializing any plugins (done with the Vue.use() method),
 * creating our root Vue instance, and mounting it to the existing page.
 *
 * The `el` option tells Vue which element on the page to mount the new
 * instance to. To tell the instance *what* to actually display on the screen,
 * a `template` or `render` option needs to be provided.
 *
 * String templates work the same way as the <template> tags inside single-file
 * components; if the Vue compiler is present (i.e. if you are using the "full"
 * build), then template strings will be compiled into a render function.
 *
 * You can also pass a render function directly, as is being done here. Render
 * functions do not require the presence of Vue's template compiler. The pattern
 * of using a simple, bare render function at the level of the root instance is
 * useful in cases where you are importing pre-compiled components and do not need
 * to ship the full build in production.
 *
 * More info about render functions can be found here:
 * https://vuejs.org/v2/guide/render-function.html
 */
(function () {
  var Vue = require("vue"),
    App = require("./Calendar.vue");
  // Create the Vue instance
  // eslint-disable-next-line no-new
  Vue.createMwApp(App).mount("#ical-calendar-root");
})();
