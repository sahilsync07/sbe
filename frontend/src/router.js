import { createRouter, createWebHistory } from "vue-router";
import StockTable from "./components/StockTable.vue";
import ImageUpload from "./components/ImageUpload.vue";
import PdfGenerator from "./components/PdfGenerator.vue";
import LedgerView from "./views/LedgerView.vue";
import DaybookView from "./views/DaybookView.vue";


const routes = [
  { path: "/", component: StockTable },
  { path: "/upload", component: ImageUpload },
  { path: "/pdf-gen", component: PdfGenerator },
  { path: "/ledger", component: LedgerView },
  { path: "/daybook", component: DaybookView },

  { path: "/:pathMatch(.*)*", redirect: "/" }, // Redirect unmatched routes to /
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
