import { createRouter, createWebHistory } from "vue-router";
import StockTable from "./components/StockTable.vue";
import ImageUpload from "./components/ImageUpload.vue";

const routes = [
  { path: "/", component: StockTable },
  { path: "/upload", component: ImageUpload },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
