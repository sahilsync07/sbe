import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import Vue3Toasty from "vue3-toastify";

const app = createApp(App);
app.use(router);
app.use(Vue3Toasty, {
  autoClose: 3000,
  position: "bottom-right",
  theme: "dark",
});
app.mount("#app");
