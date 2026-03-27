<template>
  <div class="settings-page">
    <a-card :bordered="false" class="settings-shell" :loading="loading">
      <div class="settings-toolbar">
        <strong>站点设置</strong>
        <a-button v-if="canUpdateSettings" type="primary" :loading="saving" @click="submit">保存设置</a-button>
      </div>

      <a-tabs default-active-key="site">
        <a-tab-pane key="site" title="基础设置">
          <a-form layout="vertical" :model="form" class="settings-form">
            <section class="settings-section">
              <div class="settings-grid">
                <a-form-item field="siteName" label="站点名称"><a-input v-model="form.siteName" /></a-form-item>
                <a-form-item field="siteSubtitle" label="站点副标题"><a-input v-model="form.siteSubtitle" /></a-form-item>
                <a-form-item field="logo" label="Logo 地址"><a-input v-model="form.logo" placeholder="https://..." /></a-form-item>
                <a-form-item field="githubUrl" label="GitHub 链接">
                  <a-input v-model="form.githubUrl" placeholder="https://github.com/..." />
                </a-form-item>
              </div>

              <a-form-item field="siteDescription" label="站点描述" class="settings-full">
                <a-textarea v-model="form.siteDescription" :auto-size="{ minRows: 3, maxRows: 5 }" />
              </a-form-item>
            </section>

            <section class="settings-section">
              <div class="settings-grid">
                <a-form-item field="announcementEnabled" label="启用公告">
                  <a-switch v-model="form.announcementEnabled" />
                </a-form-item>
                <a-form-item field="announcementTitle" label="公告标题">
                  <a-input v-model="form.announcementTitle" placeholder="例如：站点新动态" />
                </a-form-item>
                <a-form-item field="announcementLinkLabel" label="按钮文案">
                  <a-input v-model="form.announcementLinkLabel" placeholder="例如：立即查看" />
                </a-form-item>
                <a-form-item field="announcementLink" label="跳转链接">
                  <a-input v-model="form.announcementLink" placeholder="/posts 或 https://..." />
                </a-form-item>
              </div>

              <a-form-item field="announcementContent" label="公告内容" class="settings-full">
                <a-textarea v-model="form.announcementContent" :auto-size="{ minRows: 3, maxRows: 5 }" />
              </a-form-item>
            </section>

            <section class="settings-section">
              <div class="settings-grid">
                <a-form-item field="heroTitle" label="首页标题"><a-input v-model="form.heroTitle" /></a-form-item>
                <a-form-item field="heroDescription" label="首页描述">
                  <a-textarea v-model="form.heroDescription" :auto-size="{ minRows: 3, maxRows: 5 }" />
                </a-form-item>
              </div>
            </section>

            <section class="settings-section">
              <div class="settings-grid">
                <a-form-item field="footerText" label="页脚文案"><a-input v-model="form.footerText" /></a-form-item>
                <a-form-item field="icp" label="备案号"><a-input v-model="form.icp" /></a-form-item>
                <a-form-item field="aboutTitle" label="关于页标题"><a-input v-model="form.aboutTitle" /></a-form-item>
              </div>

              <a-form-item field="aboutContent" label="关于页内容" class="settings-full">
                <a-textarea v-model="form.aboutContent" :auto-size="{ minRows: 8, maxRows: 12 }" />
              </a-form-item>
            </section>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="home" title="首页编排">
          <HomeArrangementEditor :form="form" :can-update-settings="canUpdateSettings" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { settingsApi } from '../../api/modules';
import { useAuthStore } from '../../stores/auth';
import HomeArrangementEditor from './components/HomeArrangementEditor.vue';
import { createDefaultSiteSettings } from './site-settings';

const authStore = useAuthStore();
const canUpdateSettings = computed(() => authStore.hasPermission('settings.update'));
const loading = ref(false);
const saving = ref(false);

const form = reactive(createDefaultSiteSettings());

async function loadSettings() {
  loading.value = true;
  try {
    Object.assign(form, await settingsApi.get(true));
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '加载站点设置失败');
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (saving.value) return;

  saving.value = true;
  try {
    Object.assign(form, await settingsApi.update(form));
    Message.success('设置已保存');
  } catch (error: any) {
    Message.error(error?.response?.data?.message || '保存站点设置失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadSettings();
});
</script>

<style scoped>
.settings-page {
  display: grid;
}

.settings-shell {
  overflow: hidden;
}

.settings-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.settings-form {
  display: grid;
  gap: 18px;
}

.settings-section {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--admin-border);
  border-radius: 22px;
  background: color-mix(in srgb, var(--admin-surface-strong) 94%, transparent);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.settings-full {
  margin-bottom: 0;
}

:deep(.settings-section .arco-form-item) {
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .settings-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
