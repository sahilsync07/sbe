import { createRouter, createWebHashHistory } from 'vue-router';
import StockTable from '../components/StockTable.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import ImageUpload from '../components/ImageUpload.vue';
import LatestStock from './components/LatestStock.vue';

const routes = [
    {
        path: '/',
        component: StockTable
    },
    {
        path: '/pdf-gen',
        component: PdfGenerator
    },
    {
        path: '/upload',
        component: ImageUpload
    },
    {
        path: '/latest-stock',
        component: LatestStock
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
