import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import { Capacitor } from '@capacitor/core';
import StockTable from "./components/StockTable.vue";
import ImageUpload from "./components/ImageUpload.vue";
import LedgerView from "./views/LedgerView.vue";
import DaybookView from "./views/DaybookView.vue";
import StockTrendView from "./views/StockTrendView.vue";
import SampleRoomView from "./views/SampleRoomView.vue";
import HomeView from "./views/HomeView.vue";
import OldStockView from "./views/OldStockView.vue";
import RateChartView from "./views/RateChartView.vue";
import LineListView from "./views/LineListView.vue";
import QuotationView from "./views/QuotationView.vue";
import AnalyzerView from "./views/AnalyzerView.vue";
import { useAdmin } from "./composables/useAdmin";

const isAndroid = Capacitor.getPlatform() === 'android';

const PdfGenerator = () => isAndroid ? import('./android/components/PdfGenerator.vue') : import('./components/PdfGenerator.vue');
const LatestStock = () => import('./android/components/LatestStock.vue');

const routes = [
  { path: "/", component: StockTable },
  { path: "/upload", component: ImageUpload },
  { path: "/pdf-gen", component: PdfGenerator },
  { path: "/ledger", component: LedgerView },
  { path: "/daybook", component: DaybookView },
  { path: "/stock-trend", component: StockTrendView },
  { path: "/sample-room", component: SampleRoomView },
  { path: "/rate-chart", component: RateChartView },
  { path: "/line-list", component: LineListView },
  { path: "/latest-stock", component: LatestStock },
  { path: "/home", component: HomeView },
  { path: "/old-stock", component: OldStockView },
  { path: "/quotation", component: QuotationView },
  { path: "/analyzer", component: AnalyzerView },

  { path: "/:pathMatch(.*)*", redirect: "/" }, // Redirect unmatched routes to /
];

const router = createRouter({
  history: isAndroid ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.path === '/ledger' || to.path === '/daybook' || to.path === '/line-list' || to.path === '/quotation' || to.path === '/analyzer') {
    const { isAdmin, isSuperAdmin, checkAdminState } = useAdmin();
    await checkAdminState();
    
    if (!isAdmin.value && !isSuperAdmin.value) {
      next({ path: '/home', query: { login: 'admin' } });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
