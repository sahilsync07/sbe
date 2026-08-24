import { createApp } from "vue";
import { createPinia } from "pinia";
import Vue3Toasty from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./style.css";

import App from '@/App.vue';
import router from '@/router.js';

// Add platform class for Android-specific CSS
document.body.classList.add('platform-android');

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Vue3Toasty, {
  autoClose: 2000,
  position: "bottom-right",
  hideProgressBar: true,
  closeButton: false,
  icon: true,
  theme: "dark",
  transition: "slide",
});
app.mount("#app");
