import { createRouter, createWebHistory } from 'vue-router';
import StockTable from './components/StockTable.vue';
import PdfGenerator from './components/PdfGenerator.vue';
import ImageUpload from '../components/ImageUpload.vue';

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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
