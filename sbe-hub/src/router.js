import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LedgerView from "@/views/LedgerView.vue";
import DaybookView from "@/views/DaybookView.vue";
import StockTrendView from "@/views/StockTrendView.vue";
import SampleRoomView from "@/views/SampleRoomView.vue";
import OldStockView from "@/views/OldStockView.vue";
import RateChartView from "@/views/RateChartView.vue";
import LineListView from "@/views/LineListView.vue";
import QuotationView from "@/views/QuotationView.vue";
import AnalyzerView from "@/views/AnalyzerView.vue";
import { useAdmin } from "@/composables/useAdmin";

const PdfGenerator = () => import('@/components/PdfGenerator.vue');

const routes = [
  { path: "/", component: HomeView },
  { path: "/ledger", component: LedgerView },
  { path: "/daybook", component: DaybookView },
  { path: "/stock-trend", component: StockTrendView },
  { path: "/sample-room", component: SampleRoomView },
  { path: "/pdf-gen", component: PdfGenerator },
  { path: "/rate-chart", component: RateChartView },
  { path: "/line-list", component: LineListView },
  { path: "/quotation", component: QuotationView },
  { path: "/old-stock", component: OldStockView },
  { path: "/analyzer", component: AnalyzerView },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Admin route guard — protected pages require admin login
router.beforeEach(async (to, from, next) => {
  const protectedPaths = ['/ledger', '/daybook', '/line-list', '/quotation', '/analyzer'];
  if (protectedPaths.includes(to.path)) {
    const { isAdmin, isSuperAdmin, checkAdminState } = useAdmin();
    await checkAdminState();
    
    if (!isAdmin.value && !isSuperAdmin.value) {
      next({ path: '/', query: { login: 'admin' } });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;

