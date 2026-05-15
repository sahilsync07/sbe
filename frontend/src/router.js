import { createRouter, createWebHistory } from "vue-router";
import StockTable from "./components/StockTable.vue";
import ImageUpload from "./components/ImageUpload.vue";
import PdfGenerator from "./components/PdfGenerator.vue";
import LedgerView from "./views/LedgerView.vue";
import DaybookView from "./views/DaybookView.vue";
import StockTrendView from "./views/StockTrendView.vue";
import SampleRoomView from "./views/SampleRoomView.vue";
import HomeView from "./views/HomeView.vue";

import RateChartView from "./views/RateChartView.vue";

const routes = [
  { path: "/", component: StockTable },
  { path: "/upload", component: ImageUpload },
  { path: "/pdf-gen", component: PdfGenerator },
  { path: "/ledger", component: LedgerView },
  { path: "/daybook", component: DaybookView },
  { path: "/stock-trend", component: StockTrendView },
  { path: "/sample-room", component: SampleRoomView },
  { path: "/rate-chart", component: RateChartView },
  { path: "/home", component: HomeView },

  { path: "/:pathMatch(.*)*", redirect: "/" }, // Redirect unmatched routes to /
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
