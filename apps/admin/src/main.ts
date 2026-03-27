import '@arco-design/web-vue/dist/arco.css';

import ArcoVue from '@arco-design/web-vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { router } from './router';
import { useThemeStore } from './stores/theme';
import './styles/global.css';

const app = createApp(App);
const pinia = createPinia();

app.use(ArcoVue).use(pinia).use(router);

useThemeStore(pinia).initTheme();

app.mount('#app');
