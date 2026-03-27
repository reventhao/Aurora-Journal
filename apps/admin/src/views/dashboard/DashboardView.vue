<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div class="hero-copy">
        <span class="hero-eyebrow">仪表盘</span>
        <h1>内容概览</h1>
        <p class="hero-description">把内容存量、待处理事项和最近动态放到同一个视图里，先看重点，再处理细节。</p>

        <div class="hero-actions">
          <a-button type="primary" size="large" @click="goTo('/posts')">查看文章</a-button>
          <a-button size="large" @click="goTo('/comments')">处理评论</a-button>
        </div>

        <div class="hero-kpis">
          <div class="hero-kpi">
            <span>发布率</span>
            <strong>{{ publishRate }}%</strong>
          </div>
          <div class="hero-kpi">
            <span>评论通过率</span>
            <strong>{{ commentApprovalRate }}%</strong>
          </div>
          <div class="hero-kpi">
            <span>单篇平均浏览</span>
            <strong>{{ averageViews }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-panel">
        <div class="hero-panel__card hero-panel__card--primary">
          <span>当前重点</span>
          <strong>{{ focusSummary }}</strong>
          <small>{{ queueSummary }}</small>
        </div>

        <div class="hero-panel__row">
          <div class="hero-panel__card">
            <span>文章总量</span>
            <strong>{{ formatNumber(metrics?.totalPosts || 0) }}</strong>
            <small>全部内容</small>
          </div>
          <div class="hero-panel__card">
            <span>总浏览</span>
            <strong>{{ compactNumber(metrics?.totalViews || 0) }}</strong>
            <small>累计热度</small>
          </div>
        </div>

        <div class="hero-trend">
          <div class="hero-trend__label">
            <span>处理进度</span>
            <strong>{{ queueProgressText }}</strong>
          </div>
          <div class="hero-trend__bar">
            <span class="hero-trend__bar-fill" :style="{ width: `${queueProgress}%` }" />
          </div>
        </div>
      </div>
    </section>

    <section class="overview-grid">
      <article v-for="card in overviewCards" :key="card.label" class="overview-card" :style="{ '--overview-accent': card.accent }">
        <div class="overview-card__head">
          <span>{{ card.label }}</span>
          <small>{{ card.caption }}</small>
        </div>
        <strong>{{ card.value }}</strong>
        <p>{{ card.description }}</p>
      </article>
    </section>

    <section class="analysis-grid">
      <a-card :bordered="false" class="panel-card">
        <template #title>内容结构</template>
        <div class="mix-list">
          <article v-for="item in contentMix" :key="item.label" class="mix-item">
            <div class="mix-item__meta">
              <div class="mix-item__label">
                <span class="mix-dot" :style="{ '--mix-color': item.color }" />
                <strong>{{ item.label }}</strong>
              </div>
              <span>{{ item.value }}</span>
            </div>
            <div class="mix-bar">
              <span class="mix-bar__fill" :style="{ width: `${item.percent}%`, '--mix-color': item.color }" />
            </div>
            <small>{{ item.percent }}%</small>
          </article>
        </div>
      </a-card>

      <a-card :bordered="false" class="panel-card">
        <template #title>处理队列</template>
        <div class="queue-list">
          <button v-for="action in quickActions" :key="action.label" type="button" class="queue-item" @click="goTo(action.path)">
            <div class="queue-item__copy">
              <strong>{{ action.label }}</strong>
              <p>{{ action.description }}</p>
            </div>
            <div class="queue-item__side">
              <span>{{ action.value }}</span>
              <small>{{ action.hint }}</small>
            </div>
          </button>
        </div>
      </a-card>
    </section>

    <section class="stream-grid">
      <a-card :bordered="false" class="stream-card">
        <template #title>最近文章</template>
        <div v-if="metrics?.recentPosts?.length" class="stream-list">
          <article v-for="post in metrics.recentPosts" :key="post.id" class="stream-item">
            <div class="stream-item__main">
              <strong>{{ post.title }}</strong>
              <p>{{ post.excerpt || '暂无摘要' }}</p>
              <div class="stream-meta">
                <span>{{ post.category?.name || '未分类' }}</span>
                <span>{{ formatDate(post.createdAt) }}</span>
                <span>{{ compactNumber(post.views) }} 浏览</span>
              </div>
            </div>
            <div class="stream-item__side">
              <a-tag :color="post.status === 'PUBLISHED' ? 'green' : 'orange'">
                {{ post.status === 'PUBLISHED' ? '已发布' : '草稿' }}
              </a-tag>
            </div>
          </article>
        </div>
        <a-empty v-else description="还没有文章数据" />
      </a-card>

      <a-card :bordered="false" class="stream-card">
        <template #title>最新评论</template>
        <div v-if="metrics?.recentComments?.length" class="stream-list">
          <article v-for="comment in metrics.recentComments" :key="comment.id" class="stream-item">
            <div class="comment-avatar">{{ comment.author?.slice(0, 1) || '评' }}</div>
            <div class="stream-item__main">
              <strong>{{ comment.author }}</strong>
              <p>{{ comment.content }}</p>
              <div class="stream-meta">
                <span>{{ comment.postTitle || '未知文章' }}</span>
                <span>{{ formatDate(comment.createdAt) }}</span>
              </div>
            </div>
            <div class="stream-item__side">
              <a-tag :color="comment.approved ? 'green' : 'orange'">
                {{ comment.approved ? '已通过' : '待审核' }}
              </a-tag>
            </div>
          </article>
        </div>
        <a-empty v-else description="还没有评论数据" />
      </a-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DashboardMetrics } from '@aurora/shared';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { dashboardApi } from '../../api/modules';

const router = useRouter();
const metrics = ref<DashboardMetrics | null>(null);

const numberFormatter = new Intl.NumberFormat('zh-CN');
const compactFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const publishRate = computed(() => {
  const total = metrics.value?.totalPosts || 0;
  if (!total) return 0;
  return Math.round(((metrics.value?.publishedPosts || 0) / total) * 100);
});

const commentApprovalRate = computed(() => {
  const total = metrics.value?.totalComments || 0;
  if (!total) return 100;
  return Math.max(0, Math.round((((metrics.value?.totalComments || 0) - (metrics.value?.pendingComments || 0)) / total) * 100));
});

const averageViews = computed(() => {
  const totalPosts = metrics.value?.totalPosts || 0;
  if (!totalPosts) return '0';
  return formatNumber(Math.round((metrics.value?.totalViews || 0) / totalPosts));
});

const queueProgress = computed(() => {
  const weight = (metrics.value?.draftPosts || 0) + (metrics.value?.pendingComments || 0);
  if (!weight) return 100;
  return Math.max(8, Math.min(92, 100 - Math.round((weight / Math.max((metrics.value?.totalPosts || 0) + (metrics.value?.totalComments || 0), 1)) * 100)));
});

const queueProgressText = computed(() => {
  if ((metrics.value?.pendingComments || 0) === 0 && (metrics.value?.draftPosts || 0) === 0) {
    return '当前没有明显积压';
  }

  return `${formatNumber((metrics.value?.draftPosts || 0) + (metrics.value?.pendingComments || 0))} 项待处理`;
});

const queueSummary = computed(() => {
  const drafts = metrics.value?.draftPosts || 0;
  const pendingComments = metrics.value?.pendingComments || 0;
  return `草稿 ${formatNumber(drafts)} 篇，待审核评论 ${formatNumber(pendingComments)} 条`;
});

const focusSummary = computed(() => {
  const pendingComments = metrics.value?.pendingComments || 0;
  const drafts = metrics.value?.draftPosts || 0;

  if (pendingComments >= 5) return '优先处理评论审核';
  if (drafts >= 5) return '优先整理草稿内容';
  if ((metrics.value?.publishedPosts || 0) > 0) return '已发布内容可正常维护';
  return '从第一篇已发布内容开始';
});

const overviewCards = computed(() => [
  {
    label: '已发布',
    value: formatNumber(metrics.value?.publishedPosts || 0),
    caption: '对外可见',
    description: '当前在线可访问的文章数量。',
    accent: '#3b82f6',
  },
  {
    label: '草稿池',
    value: formatNumber(metrics.value?.draftPosts || 0),
    caption: '待补完善',
    description: '还在整理中的文章内容。',
    accent: '#f59e0b',
  },
  {
    label: '评论总量',
    value: formatNumber(metrics.value?.totalComments || 0),
    caption: '互动累计',
    description: '所有评论的累计数量。',
    accent: '#14b8a6',
  },
  {
    label: '待审核',
    value: formatNumber(metrics.value?.pendingComments || 0),
    caption: '需要处理',
    description: '当前仍需人工审核的评论。',
    accent: '#ef476f',
  },
]);

const contentMix = computed(() => {
  const totalPosts = metrics.value?.totalPosts || 0;
  const totalComments = metrics.value?.totalComments || 0;
  const safePostTotal = Math.max(totalPosts, 1);
  const safeCommentTotal = Math.max(totalComments, 1);

  return [
    {
      label: '已发布文章',
      value: formatNumber(metrics.value?.publishedPosts || 0),
      percent: Math.round(((metrics.value?.publishedPosts || 0) / safePostTotal) * 100),
      color: '#3b82f6',
    },
    {
      label: '草稿文章',
      value: formatNumber(metrics.value?.draftPosts || 0),
      percent: Math.round(((metrics.value?.draftPosts || 0) / safePostTotal) * 100),
      color: '#f59e0b',
    },
    {
      label: '已处理评论',
      value: formatNumber((metrics.value?.totalComments || 0) - (metrics.value?.pendingComments || 0)),
      percent: Math.round((((metrics.value?.totalComments || 0) - (metrics.value?.pendingComments || 0)) / safeCommentTotal) * 100),
      color: '#10b981',
    },
    {
      label: '待审核评论',
      value: formatNumber(metrics.value?.pendingComments || 0),
      percent: Math.round(((metrics.value?.pendingComments || 0) / safeCommentTotal) * 100),
      color: '#ef476f',
    },
  ];
});

const quickActions = computed(() => [
  {
    label: '评论审核',
    description: '把待审核评论清到可控范围内。',
    value: formatNumber(metrics.value?.pendingComments || 0),
    hint: '条待处理',
    path: '/comments',
  },
  {
    label: '草稿整理',
    description: '优先推进积压草稿，提升发布率。',
    value: formatNumber(metrics.value?.draftPosts || 0),
    hint: '篇草稿',
    path: '/posts',
  },
  {
    label: '媒体补充',
    description: '封面与插图统一补齐，减少后续返工。',
    value: compactNumber(metrics.value?.totalViews || 0),
    hint: '累计浏览参考',
    path: '/media',
  },
]);

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function compactNumber(value: number) {
  return compactFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function goTo(path: string) {
  void router.push(path);
}

onMounted(async () => {
  metrics.value = await dashboardApi.metrics();
});
</script>

<style scoped>
.dashboard-page {
  --dashboard-card-bg: linear-gradient(180deg, rgb(255 255 255 / 1), rgb(244 247 252 / 0.96));
  --dashboard-card-bg-soft: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(246 248 252 / 0.95));
  --dashboard-card-border: rgba(15, 23, 42, 0.08);
  --dashboard-card-shadow: 0 16px 34px rgb(15 23 42 / 0.08);
  --dashboard-card-shadow-hover: 0 22px 38px rgb(15 23 42 / 0.12);
  --dashboard-panel-bg: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(242 246 252 / 0.95));
  --dashboard-panel-bg-soft: linear-gradient(180deg, rgb(255 255 255 / 0.96), rgb(243 246 252 / 0.93));
  --dashboard-panel-border: rgba(15, 23, 42, 0.06);
  --dashboard-panel-shadow: 0 18px 36px rgb(15 23 42 / 0.09);
  --dashboard-panel-shadow-hover: 0 24px 42px rgb(15 23 42 / 0.14);
  --dashboard-hero-bg: linear-gradient(180deg, rgb(255 255 255 / 1), rgb(242 246 252 / 0.96));
  --dashboard-hero-border: rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 20px;
}

.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  gap: 20px;
  padding: 28px;
  border: 1px solid var(--dashboard-hero-border);
  border-radius: 28px;
  background: var(--dashboard-hero-bg);
  box-shadow: 0 20px 48px rgb(15 23 42 / 0.08);
}

.hero-copy {
  display: grid;
  align-content: start;
  gap: 18px;
}

.hero-eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 7px 12px;
  border: 1px solid rgb(91 140 255 / 0.22);
  border-radius: 999px;
  background: rgb(91 140 255 / 0.08);
  color: #4c6fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 0;
  color: var(--admin-text);
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.05;
}

.hero-description {
  margin: -6px 0 0;
  color: var(--admin-text-secondary);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hero-kpi {
  padding: 16px 18px;
  border: 1px solid var(--dashboard-panel-border);
  border-radius: 18px;
  background: var(--dashboard-panel-bg-soft);
  box-shadow: var(--dashboard-panel-shadow);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.hero-kpi:hover,
.hero-panel__card:hover,
.hero-trend:hover,
.overview-card:hover,
.queue-item:hover,
.stream-card:hover,
.panel-card:hover,
.stream-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--dashboard-panel-shadow-hover);
}

.hero-kpi span,
.hero-panel__card span,
.hero-trend__label span {
  display: block;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.hero-kpi strong,
.hero-panel__card strong {
  display: block;
  margin-top: 8px;
  color: var(--admin-text);
  font-size: 28px;
  line-height: 1.1;
}

.hero-panel {
  display: grid;
  gap: 14px;
  align-content: start;
}

.hero-panel__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.hero-panel__card,
.hero-trend,
.overview-card,
.queue-item {
  padding: 18px;
  border: 1px solid var(--dashboard-panel-border);
  border-radius: 22px;
  background: var(--dashboard-panel-bg);
  box-shadow: var(--dashboard-panel-shadow);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.hero-panel__card small,
.hero-trend__label strong {
  color: var(--admin-text-secondary);
}

.hero-panel__card--primary strong {
  font-size: 24px;
}

.hero-trend {
  display: grid;
  gap: 14px;
}

.hero-trend__label {
  display: grid;
  gap: 6px;
}

.hero-trend__bar,
.mix-bar {
  height: 10px;
  border-radius: 999px;
  background: rgb(148 163 184 / 0.18);
  overflow: hidden;
}

.hero-trend__bar-fill,
.mix-bar__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.hero-trend__bar-fill {
  background: linear-gradient(90deg, #4c6fff, #2ec4b6);
}

.overview-grid,
.analysis-grid,
.stream-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.overview-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.overview-card {
  position: relative;
  overflow: hidden;
  background: var(--dashboard-card-bg);
}

.overview-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 70px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--overview-accent) 14%, white), transparent);
  opacity: 0.9;
}

.overview-card__head,
.overview-card strong,
.overview-card p {
  position: relative;
}

.overview-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.overview-card__head span,
.overview-card__head small,
.overview-card p,
.mix-item small,
.queue-item__copy p,
.stream-meta {
  color: var(--admin-text-secondary);
}

.overview-card strong {
  display: block;
  margin: 18px 0 8px;
  color: var(--admin-text);
  font-size: 34px;
  line-height: 1;
}

.overview-card p {
  margin: 0;
  line-height: 1.6;
}

.panel-card,
.stream-card {
  border-radius: 24px;
  background: var(--dashboard-card-bg);
  box-shadow: var(--dashboard-card-shadow);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.panel-card :deep(.arco-card-body),
.panel-card :deep(.arco-card-header),
.stream-card :deep(.arco-card-body),
.stream-card :deep(.arco-card-header) {
  background: transparent;
}

.panel-card :deep(.arco-card-header),
.stream-card :deep(.arco-card-header) {
  border-bottom-color: var(--dashboard-card-border);
}

.panel-card :deep(.arco-card-header-title),
.stream-card :deep(.arco-card-header-title) {
  color: var(--admin-text);
}

.mix-list,
.stream-list,
.queue-list {
  display: grid;
  gap: 14px;
}

.mix-item {
  display: grid;
  gap: 8px;
}

.mix-item__meta,
.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.mix-item__label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mix-item__label strong,
.queue-item__copy strong,
.stream-item__main strong {
  color: var(--admin-text);
}

.mix-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--mix-color);
}

.mix-bar__fill {
  width: 0;
  background: linear-gradient(90deg, var(--mix-color), color-mix(in srgb, var(--mix-color) 58%, white));
}

.queue-item {
  width: 100%;
  border: 1px solid var(--dashboard-card-border);
  background: var(--dashboard-card-bg-soft);
  cursor: pointer;
  text-align: left;
}

.queue-item__copy p {
  margin: 6px 0 0;
  line-height: 1.6;
}

.queue-item__side {
  display: grid;
  justify-items: end;
  gap: 4px;
  flex: none;
}

.queue-item__side span {
  color: var(--admin-text);
  font-size: 24px;
  font-weight: 700;
}

.queue-item__side small {
  color: var(--admin-text-secondary);
}

.stream-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 18px;
  border: 1px solid var(--dashboard-card-border);
  border-radius: 18px;
  background: var(--dashboard-card-bg-soft);
  box-shadow: var(--dashboard-card-shadow);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.stream-item__main {
  min-width: 0;
  flex: 1;
}

.stream-item__main p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.stream-item__side {
  flex: none;
}

.stream-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin-top: 10px;
  font-size: 12px;
}

.comment-avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4c6fff, #56cfe1);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

[data-admin-theme='dark'] .dashboard-page {
  --dashboard-card-bg: linear-gradient(180deg, rgb(20 29 43 / 1), rgb(15 23 35 / 0.98));
  --dashboard-card-bg-soft: linear-gradient(180deg, rgb(24 34 49 / 0.98), rgb(17 25 37 / 0.96));
  --dashboard-card-border: rgba(148, 163, 184, 0.12);
  --dashboard-card-shadow: 0 16px 30px rgb(0 0 0 / 0.24);
  --dashboard-card-shadow-hover: 0 22px 40px rgb(0 0 0 / 0.32);
  --dashboard-panel-bg: linear-gradient(180deg, rgb(21 31 47 / 0.98), rgb(15 23 36 / 0.96));
  --dashboard-panel-bg-soft: linear-gradient(180deg, rgb(24 35 52 / 0.98), rgb(18 27 40 / 0.96));
  --dashboard-panel-border: rgba(148, 163, 184, 0.14);
  --dashboard-panel-shadow: 0 18px 34px rgb(0 0 0 / 0.24);
  --dashboard-panel-shadow-hover: 0 24px 42px rgb(0 0 0 / 0.32);
  --dashboard-hero-bg: linear-gradient(180deg, rgb(16 24 38 / 1), rgb(12 18 29 / 0.98));
  --dashboard-hero-border: rgba(148, 163, 184, 0.12);
}

[data-admin-theme='dark'] .dashboard-page .hero-eyebrow {
  border-color: rgb(91 140 255 / 0.3);
  background: rgb(91 140 255 / 0.14);
  color: #a9bdff;
}

[data-admin-theme='dark'] .dashboard-page .hero-trend__bar,
[data-admin-theme='dark'] .dashboard-page .mix-bar {
  background: rgb(148 163 184 / 0.14);
}

[data-admin-theme='dark'] .dashboard-page .overview-card::before {
  background: linear-gradient(180deg, color-mix(in srgb, var(--overview-accent) 18%, transparent), transparent);
  opacity: 0.42;
}

@media (max-width: 1200px) {
  .dashboard-hero,
  .analysis-grid,
  .stream-grid {
    grid-template-columns: 1fr;
  }

  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-hero {
    padding: 20px;
    border-radius: 22px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-kpis,
  .hero-panel__row,
  .overview-grid,
  .analysis-grid,
  .stream-grid {
    grid-template-columns: 1fr;
  }

  .queue-item,
  .stream-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .queue-item__side {
    justify-items: start;
  }
}
</style>
