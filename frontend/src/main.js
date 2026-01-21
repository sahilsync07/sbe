import { createApp } from "vue";
import { Capacitor } from '@capacitor/core';
import Vue3Toasty from "vue3-toastify";
import "./style.css";

// Platform detection - load Android or Web version
const isAndroidApp = Capacitor.getPlatform() === 'android';

let App, router;

if (isAndroidApp) {
  // Load Android-specific version
  const androidApp = await import('./android/App.vue');
  const androidRouter = await import('./android/router.js');
  App = androidApp.default;
  router = androidRouter.default;
} else {
  // Load Web version
  const webApp = await import('./App.vue');
  const webRouter = await import('./router.js');
  App = webApp.default;
  router = webRouter.default;
}

const app = createApp(App);
app.use(router);
app.use(Vue3Toasty, {
  autoClose: 3000,
  position: "bottom-right",
  theme: "dark",
});
app.mount("#app");
