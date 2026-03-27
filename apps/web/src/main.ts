import { createPinia } from 'pinia';
import { createApp } from 'vue';
import 'md-editor-v3/lib/preview.css';

import App from './App.vue';
import { router } from './router';
import './styles/global.css';

createApp(App).use(createPinia()).use(router).mount('#app');
