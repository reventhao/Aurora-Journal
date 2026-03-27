import { createRouter, createWebHistory } from 'vue-router';

import MainLayout from '../layouts/MainLayout.vue';
import AboutView from '../views/AboutView.vue';
import CategoriesView from '../views/CategoriesView.vue';
import CategoryDetailView from '../views/CategoryDetailView.vue';
import HomeView from '../views/HomeView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import PostDetailView from '../views/PostDetailView.vue';
import PostsView from '../views/PostsView.vue';
import ReadingListView from '../views/ReadingListView.vue';
import TagDetailView from '../views/TagDetailView.vue';
import TagsView from '../views/TagsView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'posts', name: 'posts', component: PostsView },
        { path: 'reading-list', name: 'reading-list', component: ReadingListView },
        { path: 'posts/:slug', name: 'post-detail', component: PostDetailView },
        { path: 'categories', name: 'categories', component: CategoriesView },
        { path: 'categories/:slug', name: 'category-detail', component: CategoryDetailView },
        { path: 'tags', name: 'tags', component: TagsView },
        { path: 'tags/:slug', name: 'tag-detail', component: TagDetailView },
        { path: 'about', name: 'about', component: AboutView },
        { path: ':pathMatch(.*)*', name: 'not-found', component: NotFoundView },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
