<template>
  <div class="auth-page" :data-auth-theme="theme">
    <div class="auth-shell">
      <a-card class="auth-card" :bordered="false">
        <div class="auth-card__inner">
          <header class="auth-headbar">
            <div class="auth-brand">
              <span class="auth-badge">Aurora Admin</span>
            </div>

            <button type="button" class="auth-theme-toggle" @click="toggleTheme">
              <icon-moon-fill v-if="theme === 'light'" />
              <icon-sun-fill v-else />
              <span>{{ theme === 'light' ? '深色' : '浅色' }}</span>
            </button>
          </header>

          <div class="auth-view-shell">
            <Transition name="auth-view-flip" mode="out-in">
              <section v-if="!resetVisible" key="front" class="auth-view auth-view--front">
                <section class="auth-hero">
                  <div class="auth-mode-tabs" role="tablist" aria-label="认证模式">
                    <span class="auth-mode-tabs__indicator" :style="indicatorStyle" aria-hidden="true" />
                    <button
                      type="button"
                      class="auth-mode-tab"
                      :class="{ 'auth-mode-tab--active': mode === 'login' }"
                      @click="setMode('login')"
                    >
                      登录
                    </button>
                    <button
                      type="button"
                      class="auth-mode-tab"
                      :class="{ 'auth-mode-tab--active': mode === 'register' }"
                      @click="setMode('register')"
                    >
                      注册
                    </button>
                  </div>
                </section>

                <a-alert v-if="feedback.text && feedback.scope !== 'resetPassword'" :type="feedback.type" :show-icon="true" class="auth-feedback">
                  {{ feedback.text }}
                </a-alert>

                <div v-if="feedback.debugCode && feedback.scope === mode" class="auth-debug-card">
                  <span>开发验证码</span>
                  <strong>{{ feedback.debugCode }}</strong>
                </div>

                <Transition name="auth-panel-switch" mode="out-in">
                  <section :key="mode" class="auth-panel-shell">
                    <div v-if="mode === 'login'" class="auth-panel auth-panel--login">
                      <a-form layout="vertical" :model="loginForm">
                        <div class="auth-form-grid">
                          <a-form-item field="email" label="邮箱">
                            <a-input v-model="loginForm.email" size="large" placeholder="admin@aurora.local" @press-enter="submitLogin">
                              <template #prefix>
                                <span class="auth-input-prefix">@</span>
                              </template>
                            </a-input>
                          </a-form-item>

                          <a-form-item field="password" label="密码">
                            <a-input-password v-model="loginForm.password" size="large" placeholder="请输入密码" @press-enter="submitLogin">
                              <template #prefix>
                                <icon-lock />
                              </template>
                            </a-input-password>
                          </a-form-item>
                        </div>

                        <div class="auth-actions">
                          <a-button type="primary" long size="large" :loading="loginSubmitting" @click="submitLogin">登录</a-button>
                        </div>
                      </a-form>

                      <div class="auth-helper-row auth-helper-row--end">
                        <button type="button" class="auth-inline-link" @click="openResetView">忘记密码</button>
                      </div>

                      <div class="auth-demo">
                        <span>演示账号</span>
                        <code>admin@aurora.local / Admin@123456</code>
                      </div>
                    </div>

                    <div v-else class="auth-panel auth-panel--register">
                      <a-form layout="vertical" :model="registerForm">
                        <div class="auth-form-grid">
                          <a-form-item field="name" label="姓名">
                            <a-input v-model="registerForm.name" size="large" placeholder="请输入姓名">
                              <template #prefix>
                                <icon-user />
                              </template>
                            </a-input>
                          </a-form-item>

                          <a-form-item field="email" label="邮箱">
                            <a-input v-model="registerForm.email" size="large" placeholder="请输入邮箱">
                              <template #prefix>
                                <span class="auth-input-prefix">@</span>
                              </template>
                            </a-input>
                          </a-form-item>

                          <a-form-item field="code" label="验证码">
                            <div class="auth-code-row">
                              <a-input v-model="registerForm.code" size="large" placeholder="请输入验证码" />
                              <a-button
                                size="large"
                                class="auth-code-button"
                                :loading="codeSendingPurpose === 'register'"
                                :disabled="registerCodeDisabled"
                                @click="sendCode('register')"
                              >
                                {{ registerCodeLabel }}
                              </a-button>
                            </div>
                          </a-form-item>

                          <a-form-item field="password" label="密码">
                            <a-input-password v-model="registerForm.password" size="large" placeholder="至少 8 位">
                              <template #prefix>
                                <icon-lock />
                              </template>
                            </a-input-password>
                          </a-form-item>

                          <a-form-item field="confirmPassword" label="确认密码">
                            <a-input-password v-model="registerForm.confirmPassword" size="large" placeholder="请再次输入密码">
                              <template #prefix>
                                <icon-lock />
                              </template>
                            </a-input-password>
                          </a-form-item>
                        </div>

                        <div class="auth-actions">
                          <a-button type="primary" long size="large" :loading="registerSubmitting" @click="submitRegister">注册</a-button>
                        </div>
                      </a-form>
                    </div>
                  </section>
                </Transition>
              </section>

              <section v-else key="reset" class="auth-view auth-view--reset">
                <div class="auth-reset-head">
                  <button type="button" class="auth-back-link" @click="closeResetView">返回登录</button>
                  <h1>找回密码</h1>
                </div>

                <a-alert v-if="feedback.text && feedback.scope === 'resetPassword'" :type="feedback.type" :show-icon="true" class="auth-feedback">
                  {{ feedback.text }}
                </a-alert>

                <div v-if="feedback.debugCode && feedback.scope === 'resetPassword'" class="auth-debug-card">
                  <span>开发验证码</span>
                  <strong>{{ feedback.debugCode }}</strong>
                </div>

                <div class="auth-panel auth-panel--reset">
                  <a-form layout="vertical" :model="resetForm">
                    <div class="auth-form-grid">
                      <a-form-item field="email" label="邮箱">
                        <a-input v-model="resetForm.email" size="large" placeholder="请输入邮箱">
                          <template #prefix>
                            <span class="auth-input-prefix">@</span>
                          </template>
                        </a-input>
                      </a-form-item>

                      <a-form-item field="code" label="验证码">
                        <div class="auth-code-row auth-code-row--compact">
                          <a-input v-model="resetForm.code" size="large" placeholder="请输入验证码" />
                          <a-button
                            size="large"
                            class="auth-code-button"
                            :loading="codeSendingPurpose === 'resetPassword'"
                            :disabled="resetCodeDisabled"
                            @click="sendCode('resetPassword')"
                          >
                            {{ resetCodeLabel }}
                          </a-button>
                        </div>
                      </a-form-item>

                      <a-form-item field="password" label="新密码">
                        <a-input-password v-model="resetForm.password" size="large" placeholder="至少 8 位">
                          <template #prefix>
                            <icon-lock />
                          </template>
                        </a-input-password>
                      </a-form-item>

                      <a-form-item field="confirmPassword" label="确认密码">
                        <a-input-password v-model="resetForm.confirmPassword" size="large" placeholder="请再次输入新密码">
                          <template #prefix>
                            <icon-lock />
                          </template>
                        </a-input-password>
                      </a-form-item>
                    </div>

                    <div class="auth-actions">
                      <a-button type="primary" long size="large" :loading="resetSubmitting" @click="submitReset">重置密码</a-button>
                    </div>
                  </a-form>
                </div>
              </section>
            </Transition>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import { IconLock, IconMoonFill, IconSunFill, IconUser } from '@arco-design/web-vue/es/icon';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { authApi } from '../../api/modules';
import { getFirstAvailablePath } from '../../router';
import { useAuthStore } from '../../stores/auth';

type AuthTheme = 'light' | 'dark';
type AuthMode = 'login' | 'register';
type FeedbackScope = AuthMode | 'resetPassword' | '';
type FeedbackType = 'info' | 'success' | 'warning' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const router = useRouter();
const authStore = useAuthStore();

const theme = ref<AuthTheme>((localStorage.getItem('aurora_login_theme') as AuthTheme) || 'light');
const mode = ref<AuthMode>('login');
const resetVisible = ref(false);
const loginSubmitting = ref(false);
const registerSubmitting = ref(false);
const resetSubmitting = ref(false);
const codeSendingPurpose = ref<'register' | 'resetPassword' | ''>('');
const feedback = reactive({
  type: 'info' as FeedbackType,
  text: '',
  debugCode: '',
  scope: '' as FeedbackScope,
});
const countdowns = reactive({
  register: 0,
  resetPassword: 0,
});

const loginForm = reactive({
  email: 'admin@aurora.local',
  password: 'Admin@123456',
});

const registerForm = reactive({
  name: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
});

const resetForm = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
});

const timer = window.setInterval(() => {
  if (countdowns.register > 0) countdowns.register -= 1;
  if (countdowns.resetPassword > 0) countdowns.resetPassword -= 1;
}, 1000);

const indicatorStyle = computed(() => ({
  transform: `translateX(${mode.value === 'register' ? '100%' : '0%'})`,
}));

const registerCodeLabel = computed(() => (countdowns.register > 0 ? `${countdowns.register}s` : '发送验证码'));
const resetCodeLabel = computed(() => (countdowns.resetPassword > 0 ? `${countdowns.resetPassword}s` : '发送验证码'));
const registerCodeDisabled = computed(
  () => Boolean(codeSendingPurpose.value) || countdowns.register > 0 || !isValidEmail(registerForm.email),
);
const resetCodeDisabled = computed(
  () => Boolean(codeSendingPurpose.value) || countdowns.resetPassword > 0 || !isValidEmail(resetForm.email),
);

onBeforeUnmount(() => {
  window.clearInterval(timer);
});

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  localStorage.setItem('aurora_login_theme', theme.value);
}

function setMode(nextMode: AuthMode) {
  mode.value = nextMode;
  resetVisible.value = false;
  clearFeedback();
}

function clearFeedback() {
  feedback.type = 'info';
  feedback.text = '';
  feedback.debugCode = '';
  feedback.scope = '';
}

function setFeedback(type: FeedbackType, text: string, scope: FeedbackScope = '', debugCode = '') {
  feedback.type = type;
  feedback.text = text;
  feedback.scope = scope;
  feedback.debugCode = debugCode;
}

function openResetView() {
  resetVisible.value = true;
  if (!resetForm.email.trim()) {
    resetForm.email = loginForm.email.trim();
  }

  if (feedback.scope === 'resetPassword') {
    clearFeedback();
  }
}

function closeResetView() {
  resetVisible.value = false;
  if (feedback.scope === 'resetPassword') {
    clearFeedback();
  }
}

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

function extractErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join('，');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

function validatePassword(value: string, label = '密码') {
  if (value.trim().length < 8) {
    return `${label}至少 8 位`;
  }

  return '';
}

function validateCode(value: string) {
  return /^\d{6}$/.test(value.trim()) ? '' : '请输入 6 位验证码';
}

function validateRegisterForm() {
  if (!registerForm.name.trim()) return '请输入姓名';
  if (!isValidEmail(registerForm.email)) return '请输入有效邮箱';
  if (validateCode(registerForm.code)) return validateCode(registerForm.code);
  if (validatePassword(registerForm.password)) return validatePassword(registerForm.password);
  if (registerForm.password !== registerForm.confirmPassword) return '两次输入的密码不一致';
  return '';
}

function validateResetForm() {
  if (!isValidEmail(resetForm.email)) return '请输入有效邮箱';
  if (validateCode(resetForm.code)) return validateCode(resetForm.code);
  if (validatePassword(resetForm.password, '新密码')) return validatePassword(resetForm.password, '新密码');
  if (resetForm.password !== resetForm.confirmPassword) return '两次输入的新密码不一致';
  return '';
}

async function sendCode(purpose: 'register' | 'resetPassword') {
  const email = purpose === 'register' ? registerForm.email : resetForm.email;
  const fallback = purpose === 'register' ? '验证码发送失败' : '重置验证码发送失败';

  if (!isValidEmail(email)) {
    const message = '请输入有效邮箱';
    setFeedback('error', message, purpose);
    Message.error(message);
    return;
  }

  codeSendingPurpose.value = purpose;

  try {
    const result = await authApi.requestEmailCode({
      email: email.trim(),
      purpose,
    });

    countdowns[purpose] = 60;
    setFeedback(result.debugCode ? 'warning' : 'success', result.message, purpose, result.debugCode || '');
    Message.success(result.message);
  } catch (error) {
    const message = extractErrorMessage(error, fallback);
    setFeedback('error', message, purpose);
    Message.error(message);
  } finally {
    codeSendingPurpose.value = '';
  }
}

async function submitLogin() {
  clearFeedback();

  if (!isValidEmail(loginForm.email)) {
    const message = '请输入有效邮箱';
    setFeedback('error', message);
    Message.error(message);
    return;
  }

  if (!loginForm.password.trim()) {
    const message = '请输入密码';
    setFeedback('error', message);
    Message.error(message);
    return;
  }

  loginSubmitting.value = true;

  try {
    await authStore.login(loginForm.email.trim(), loginForm.password);
    Message.success('登录成功');
    await router.replace(getFirstAvailablePath(authStore));
  } catch (error) {
    const message = extractErrorMessage(error, '登录失败，请检查账号或密码');
    setFeedback('error', message);
    Message.error(message);
  } finally {
    loginSubmitting.value = false;
  }
}

async function submitRegister() {
  clearFeedback();
  const validationMessage = validateRegisterForm();

  if (validationMessage) {
    setFeedback('error', validationMessage, 'register');
    Message.error(validationMessage);
    return;
  }

  registerSubmitting.value = true;

  try {
    await authStore.register({
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      code: registerForm.code.trim(),
    });

    Message.success('注册成功');
    await router.replace(getFirstAvailablePath(authStore));
  } catch (error) {
    const message = extractErrorMessage(error, '注册失败，请稍后重试');
    setFeedback('error', message, 'register');
    Message.error(message);
  } finally {
    registerSubmitting.value = false;
  }
}

async function submitReset() {
  clearFeedback();
  const validationMessage = validateResetForm();

  if (validationMessage) {
    setFeedback('error', validationMessage, 'resetPassword');
    Message.error(validationMessage);
    return;
  }

  resetSubmitting.value = true;

  try {
    await authApi.resetPassword({
      email: resetForm.email.trim(),
      password: resetForm.password,
      code: resetForm.code.trim(),
    });

    loginForm.email = resetForm.email.trim();
    loginForm.password = resetForm.password;
    resetVisible.value = false;
    mode.value = 'login';
    setFeedback('success', '密码已重置，请直接登录', 'login');
    Message.success('密码已重置');
  } catch (error) {
    const message = extractErrorMessage(error, '重置密码失败，请稍后重试');
    setFeedback('error', message, 'resetPassword');
    Message.error(message);
  } finally {
    resetSubmitting.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  --auth-bg: linear-gradient(180deg, #eef3fb 0%, #f7f9fc 52%, #eef2f7 100%);
  --auth-grid: rgba(15, 23, 42, 0.04);
  --auth-orb-a: rgba(37, 99, 235, 0.12);
  --auth-orb-b: rgba(14, 165, 233, 0.11);
  --auth-surface: rgba(255, 255, 255, 0.9);
  --auth-surface-strong: rgba(255, 255, 255, 0.98);
  --auth-border: rgba(148, 163, 184, 0.18);
  --auth-shadow: 0 38px 90px rgba(15, 23, 42, 0.12);
  --auth-text: #0f172a;
  --auth-text-soft: #64748b;
  --auth-text-faint: #94a3b8;
  --auth-primary: linear-gradient(135deg, #2563eb, #1d4ed8);
  --auth-primary-shadow: 0 18px 34px rgba(37, 99, 235, 0.24);
  --auth-input-bg: #f8fafc;
  --auth-input-bg-hover: #ffffff;
  --auth-input-border: rgba(148, 163, 184, 0.28);
  --auth-input-border-hover: rgba(59, 130, 246, 0.34);
  --auth-input-border-focus: rgba(37, 99, 235, 0.54);
  --auth-input-shadow-focus: 0 0 0 4px rgba(37, 99, 235, 0.1);
  --auth-code-btn-bg: rgba(255, 255, 255, 0.92);
  --auth-code-btn-bg-hover: #ffffff;
  --auth-code-btn-border: rgba(148, 163, 184, 0.28);
  --auth-code-btn-border-hover: rgba(59, 130, 246, 0.34);
  --auth-code-btn-text: #1e293b;
  --auth-badge-bg: rgba(37, 99, 235, 0.08);
  --auth-badge-text: #2563eb;
  --auth-tab-bg: rgba(148, 163, 184, 0.12);
  --auth-tab-active: #ffffff;
  --auth-tab-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  --auth-debug-bg: rgba(37, 99, 235, 0.08);
  --auth-debug-text: #1d4ed8;

  position: relative;
  min-height: 100vh;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 18%, var(--auth-orb-a), transparent 26%),
    radial-gradient(circle at 82% 12%, var(--auth-orb-b), transparent 20%),
    var(--auth-bg);
}

.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, transparent 0, transparent calc(100% - 1px), var(--auth-grid) calc(100% - 1px)),
    linear-gradient(to bottom, transparent 0, transparent calc(100% - 1px), var(--auth-grid) calc(100% - 1px));
  background-size: 34px 34px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent 86%);
  pointer-events: none;
}

.auth-page[data-auth-theme='dark'] {
  --auth-bg: linear-gradient(180deg, #08111c 0%, #0c1320 56%, #121925 100%);
  --auth-grid: rgba(148, 163, 184, 0.08);
  --auth-orb-a: rgba(59, 130, 246, 0.18);
  --auth-orb-b: rgba(14, 165, 233, 0.14);
  --auth-surface: rgba(15, 23, 42, 0.82);
  --auth-surface-strong: rgba(15, 23, 42, 0.96);
  --auth-border: rgba(71, 85, 105, 0.38);
  --auth-shadow: 0 42px 100px rgba(0, 0, 0, 0.34);
  --auth-text: #f8fafc;
  --auth-text-soft: #94a3b8;
  --auth-text-faint: #64748b;
  --auth-primary: linear-gradient(135deg, #3b82f6, #2563eb);
  --auth-primary-shadow: 0 20px 38px rgba(37, 99, 235, 0.3);
  --auth-input-bg: rgba(15, 23, 42, 0.88);
  --auth-input-bg-hover: #13203a;
  --auth-input-border: rgba(71, 85, 105, 0.72);
  --auth-input-border-hover: rgba(96, 165, 250, 0.5);
  --auth-input-border-focus: rgba(96, 165, 250, 0.74);
  --auth-input-shadow-focus: 0 0 0 4px rgba(59, 130, 246, 0.18);
  --auth-code-btn-bg: rgba(15, 23, 42, 0.9);
  --auth-code-btn-bg-hover: rgba(19, 32, 58, 0.98);
  --auth-code-btn-border: rgba(71, 85, 105, 0.72);
  --auth-code-btn-border-hover: rgba(96, 165, 250, 0.5);
  --auth-code-btn-text: #e2e8f0;
  --auth-badge-bg: rgba(59, 130, 246, 0.14);
  --auth-badge-text: #bfdbfe;
  --auth-tab-bg: rgba(148, 163, 184, 0.1);
  --auth-tab-active: rgba(30, 41, 59, 0.96);
  --auth-tab-shadow: 0 12px 26px rgba(0, 0, 0, 0.2);
  --auth-debug-bg: rgba(37, 99, 235, 0.14);
  --auth-debug-text: #bfdbfe;
}

.auth-shell {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  align-content: start;
  min-height: calc(100vh - 48px);
  padding-top: clamp(72px, 11vh, 128px);
}

.auth-card {
  position: relative;
  isolation: isolate;
  width: min(446px, 100%);
  border: 1px solid var(--auth-border);
  border-radius: 34px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 160px),
    var(--auth-surface-strong);
  box-shadow: var(--auth-shadow);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  inset: -80px auto auto -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.12), transparent 72%);
  pointer-events: none;
}

.auth-card::after {
  content: '';
  position: absolute;
  inset: auto -88px -108px auto;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1), transparent 74%);
  pointer-events: none;
}

:deep(.auth-card .arco-card-body) {
  padding: 0;
}

.auth-card__inner {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18px;
  padding: 20px;
}

.auth-headbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.auth-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--auth-badge-bg);
  color: var(--auth-badge-text);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: 1px solid var(--auth-border);
  border-radius: 999px;
  background: var(--auth-surface);
  color: var(--auth-text);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.auth-theme-toggle:hover {
  transform: translateY(-1px);
  border-color: var(--auth-input-border-hover);
}

.auth-hero {
  display: grid;
  gap: 12px;
}

.auth-view-shell {
  position: relative;
  min-height: 508px;
  perspective: 1600px;
}

.auth-view {
  display: grid;
  gap: 16px;
  align-content: start;
  min-height: 100%;
}

.auth-view-flip-enter-active,
.auth-view-flip-leave-active {
  transition:
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 200ms ease;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.auth-view-flip-enter-from {
  opacity: 0;
  transform: rotateY(-74deg) scale(0.985);
}

.auth-view-flip-leave-to {
  opacity: 0;
  transform: rotateY(74deg) scale(0.985);
}

.auth-mode-tabs {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  padding: 6px;
  border-radius: 20px;
  background: var(--auth-tab-bg);
}

.auth-mode-tabs__indicator {
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc((100% - 12px) / 2);
  height: calc(100% - 12px);
  border-radius: 16px;
  background: var(--auth-tab-active);
  box-shadow: var(--auth-tab-shadow);
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

.auth-mode-tab {
  position: relative;
  z-index: 1;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--auth-text-soft);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease;
}

.auth-mode-tab:hover {
  color: var(--auth-text);
}

.auth-mode-tab--active {
  color: var(--auth-text);
}

.auth-feedback {
  border-radius: 18px;
}

.auth-debug-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--auth-debug-bg);
}

.auth-debug-card span {
  color: var(--auth-text-soft);
  font-size: 12px;
  font-weight: 700;
}

.auth-debug-card strong {
  color: var(--auth-debug-text);
  font-size: 24px;
  letter-spacing: 0.16em;
}

.auth-panel-shell {
  min-height: 360px;
}

.auth-panel-switch-enter-active,
.auth-panel-switch-leave-active {
  transition:
    opacity 160ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.auth-panel-switch-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.auth-panel-switch-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.auth-panel-switch-enter-active .auth-form-grid > *,
.auth-panel-switch-enter-active .auth-actions,
.auth-panel-switch-enter-active .auth-helper-row,
.auth-panel-switch-enter-active .auth-demo {
  opacity: 0;
  animation: auth-tile-settle 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.auth-panel-switch-enter-active .auth-form-grid > *:nth-child(1) {
  animation-delay: 10ms;
}

.auth-panel-switch-enter-active .auth-form-grid > *:nth-child(2) {
  animation-delay: 40ms;
}

.auth-panel-switch-enter-active .auth-form-grid > *:nth-child(3) {
  animation-delay: 70ms;
}

.auth-panel-switch-enter-active .auth-form-grid > *:nth-child(4) {
  animation-delay: 100ms;
}

.auth-panel-switch-enter-active .auth-form-grid > *:nth-child(5) {
  animation-delay: 130ms;
}

.auth-panel-switch-enter-active .auth-actions {
  animation-delay: 150ms;
}

.auth-panel-switch-enter-active .auth-helper-row {
  animation-delay: 180ms;
}

.auth-panel-switch-enter-active .auth-demo {
  animation-delay: 200ms;
}

.auth-panel {
  display: grid;
  gap: 14px;
  align-content: start;
}

.auth-form-grid {
  display: grid;
  gap: 14px;
}

:deep(.auth-panel .arco-form-item) {
  margin-bottom: 0;
}

:deep(.auth-panel .arco-form-item-label-col) {
  margin-bottom: 8px;
  color: var(--auth-text);
  font-weight: 700;
}

:deep(.auth-panel .arco-input-wrapper),
:deep(.auth-panel .arco-input-password) {
  min-height: 52px;
  border-radius: 16px;
  border-color: var(--auth-input-border);
  background: var(--auth-input-bg);
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

:deep(.auth-panel .arco-input-wrapper:hover),
:deep(.auth-panel .arco-input-password:hover) {
  background: var(--auth-input-bg-hover);
  border-color: var(--auth-input-border-hover);
}

:deep(.auth-panel .arco-input-wrapper:focus-within),
:deep(.auth-panel .arco-input-password:focus-within) {
  background: var(--auth-input-bg-hover);
  border-color: var(--auth-input-border-focus);
  box-shadow: var(--auth-input-shadow-focus);
}

:deep(.auth-panel .arco-input),
:deep(.auth-panel .arco-input-inner),
:deep(.auth-panel .arco-input-password input),
:deep(.auth-panel input) {
  color: var(--auth-text);
  -webkit-text-fill-color: var(--auth-text);
  caret-color: var(--auth-text);
}

:deep(.auth-panel .arco-input::placeholder),
:deep(.auth-panel .arco-input-inner::placeholder),
:deep(.auth-panel .arco-input-password input::placeholder),
:deep(.auth-panel input::placeholder) {
  color: var(--auth-text-faint);
  -webkit-text-fill-color: var(--auth-text-faint);
}

:deep(.auth-panel input:-webkit-autofill),
:deep(.auth-panel input:-webkit-autofill:hover),
:deep(.auth-panel input:-webkit-autofill:focus),
:deep(.auth-panel input:-webkit-autofill:active) {
  -webkit-text-fill-color: var(--auth-text);
  caret-color: var(--auth-text);
  -webkit-box-shadow: 0 0 0 1000px var(--auth-input-bg-hover) inset;
  box-shadow: 0 0 0 1000px var(--auth-input-bg-hover) inset;
  transition: background-color 99999s ease-in-out 0s;
}

:deep(.auth-panel .arco-input-prefix),
:deep(.auth-panel .arco-input-password .arco-input-prefix),
:deep(.auth-panel .arco-input-password .arco-input-suffix),
:deep(.auth-panel .arco-input-password .arco-icon-hover) {
  color: var(--auth-text-faint);
}

.auth-input-prefix {
  font-weight: 800;
}

.auth-code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 144px;
  gap: 12px;
}

.auth-code-row--compact {
  grid-template-columns: minmax(0, 1fr) 140px;
}

.auth-code-button {
  height: 52px;
  border-radius: 16px;
  font-weight: 700;
}

.auth-actions {
  margin-top: 12px;
}

:deep(.auth-actions .arco-btn) {
  height: 52px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 800;
  background: var(--auth-primary);
  box-shadow: var(--auth-primary-shadow);
}

:deep(.auth-code-button.arco-btn) {
  height: 52px;
  border-radius: 16px;
  border-color: var(--auth-code-btn-border);
  background: var(--auth-code-btn-bg);
  color: var(--auth-code-btn-text);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

:deep(.auth-code-button.arco-btn:hover) {
  border-color: var(--auth-code-btn-border-hover);
  background: var(--auth-code-btn-bg-hover);
  color: var(--auth-code-btn-text);
}

:deep(.auth-code-button.arco-btn:not(.arco-btn-disabled):hover) {
  transform: translateY(-1px);
}

:deep(.auth-code-button.arco-btn.arco-btn-disabled) {
  color: var(--auth-text-faint);
  background: color-mix(in srgb, var(--auth-code-btn-bg) 86%, transparent);
  border-color: color-mix(in srgb, var(--auth-code-btn-border) 80%, transparent);
}

.auth-helper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.auth-helper-row--end {
  justify-content: flex-end;
}

.auth-inline-link,
.auth-back-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.auth-inline-link:hover,
.auth-back-link:hover {
  text-decoration: underline;
}

.auth-demo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid var(--auth-border);
  background: rgba(148, 163, 184, 0.07);
}

.auth-demo span {
  color: var(--auth-text-soft);
  font-size: 12px;
  font-weight: 700;
}

.auth-demo code {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--auth-debug-bg);
  color: var(--auth-debug-text);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.auth-reset-head {
  display: grid;
  gap: 8px;
}

.auth-reset-head h1 {
  margin: 0;
  color: var(--auth-text);
  font-size: 26px;
  line-height: 1;
  letter-spacing: -0.04em;
}

@keyframes auth-tile-settle {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.992);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 720px) {
  .auth-page {
    padding: 16px;
  }

  .auth-shell {
    min-height: calc(100vh - 32px);
    padding-top: 40px;
  }

  .auth-card {
    border-radius: 28px;
  }

  .auth-card__inner {
    padding: 18px;
  }

  .auth-view-shell {
    min-height: auto;
  }

  .auth-headbar,
  .auth-demo {
    flex-direction: column;
    align-items: flex-start;
  }

  .auth-code-row,
  .auth-code-row--compact {
    grid-template-columns: 1fr;
  }

  .auth-brand {
    flex-wrap: wrap;
  }

  .auth-theme-toggle {
    width: 100%;
    justify-content: center;
  }

  .auth-demo code {
    width: 100%;
  }
}
</style>
