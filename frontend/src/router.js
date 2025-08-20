import { createRouter, createWebHistory } from "vue-router";
import StockTable from "./components/StockTable.vue";
import ImageUpload from "./components/ImageUpload.vue";

const routes = [
  { path: "/", component: StockTable },
  { path: "/upload", component: ImageUpload },
  { path: "/:pathMatch(.*)*", redirect: "/" }, // Redirect unmatched routes to /
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
