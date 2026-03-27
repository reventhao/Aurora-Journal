<template>
  <a-card :bordered="false" class="empty-state-card">
    <div class="empty-state">
      <span class="empty-state-badge">403</span>
      <h2>没有访问权限</h2>
      <p>当前账号没有进入这个页面的权限。请联系管理员分配相应角色，或返回你有权限的功能页。</p>
      <a-space>
        <a-button type="primary" @click="goHome">返回首页</a-button>
        <a-button @click="goBack">返回上一页</a-button>
      </a-space>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  void router.push('/dashboard');
}

function goBack() {
  void router.back();
}
</script>

<style scoped>
.empty-state-card {
  min-height: 360px;
}

.empty-state {
  display: grid;
  justify-items: start;
  gap: 16px;
  max-width: 520px;
  padding: 24px 4px;
}

.empty-state h2 {
  margin: 0;
  font-size: 28px;
}

.empty-state p {
  margin: 0;
  color: var(--admin-text-secondary);
  line-height: 1.7;
}

.empty-state-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(245, 63, 63, 0.12);
  color: #cb272d;
  font-weight: 700;
}
</style>
