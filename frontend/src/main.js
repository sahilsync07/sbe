import { createApp } from "vue";
import { createPinia } from "pinia";
import { Capacitor } from '@capacitor/core';
import Vue3Toasty from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./style.css";

// Platform detection - load Android or Web version
(async () => {
  const isAndroidApp = Capacitor.getPlatform() === 'android';

  let App, router;

  if (isAndroidApp) {
    // Add platform class for Android-specific CSS
    document.body.classList.add('platform-android');

    // Load Android-specific version
    const androidApp = await import('./android/App.vue');
    App = androidApp.default;
  } else {
    // Load Web version
    const webApp = await import('./App.vue');
    App = webApp.default;
  }

  const mainRouter = await import('./router.js');
  router = mainRouter.default;

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(Vue3Toasty, {
    autoClose: 2500,
    position: "bottom-center", 
    hideProgressBar: true,
    closeButton: false,
    icon: true,
  });
  app.mount("#app");
})();
