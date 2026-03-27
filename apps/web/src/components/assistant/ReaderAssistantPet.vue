<template>
  <div class="assistant-dock" :style="dockStyle" :data-skin="skin">
    <transition name="assistant-panel-fade">
      <section v-if="panelVisible" class="assistant-panel">
        <header class="assistant-panel__header">
          <div class="assistant-panel__identity">
            <AssistantLive2D
              :mood="currentMood"
              :animation="currentAnimation"
              :species="petKind"
              :speaking="speaking"
              :tracking="trackingEnabled"
            />
            <div>
              <strong>阅读助手</strong>
              <p>{{ panelSubtitle }}</p>
            </div>
          </div>

          <div class="assistant-panel__tools">
            <button type="button" class="assistant-skin" @click="cyclePetKind">
              换宠
            </button>
            <button type="button" class="assistant-skin" @click="cycleSkin">
              换肤
            </button>
            <button
              type="button"
              class="assistant-reset"
              @click="resetConversation"
            >
              清空
            </button>
            <button
              type="button"
              class="assistant-close"
              @click="panelVisible = false"
            >
              收起
            </button>
          </div>
        </header>

        <div ref="messagesRef" class="assistant-messages">
          <article
            v-for="message in messages"
            :key="message.id"
            class="assistant-message"
            :class="`assistant-message--${message.role}`"
          >
            <strong>{{ message.role === "assistant" ? "助手" : "你" }}</strong>
            <p>{{ message.content }}</p>
          </article>

          <div
            v-if="loading"
            class="assistant-message assistant-message--assistant assistant-message--typing"
          >
            <strong>助手</strong>
            <p>
              {{
                includePageContext
                  ? "正在整理当前页面内容..."
                  : "正在组织回答..."
              }}
            </p>
          </div>
        </div>

        <div v-if="quickActions.length" class="assistant-actions">
          <button
            v-for="action in quickActions"
            :key="action.id"
            type="button"
            class="assistant-chip"
            @click="runQuickAction(action.prompt)"
          >
            {{ action.label }}
          </button>
        </div>

        <form class="assistant-composer" @submit.prevent="submitPrompt()">
          <textarea
            v-model="prompt"
            class="assistant-input"
            rows="3"
            maxlength="2000"
            placeholder="问我：这篇文章重点是什么？"
          />
          <div class="assistant-composer__footer">
            <div class="assistant-composer__meta">
              <span>{{ providerLabel }}</span>
              <button
                type="button"
                class="assistant-toggle-chip"
                :data-active="includePageContext"
                :aria-pressed="includePageContext"
                @click="includePageContext = !includePageContext"
              >
                {{ includePageContext ? "页文 开" : "页文 关" }}
              </button>
              <button
                type="button"
                class="assistant-toggle-chip"
                :data-active="autonomyEnabled"
                :aria-pressed="autonomyEnabled"
                @click="toggleAutonomy"
              >
                {{ autonomyEnabled ? "主动 开" : "主动 关" }}
              </button>
            </div>
            <button
              type="submit"
              class="assistant-send"
              :disabled="loading || !prompt.trim()"
            >
              发送
            </button>
          </div>
        </form>
      </section>
    </transition>

    <transition name="assistant-bubble-fade">
      <button
        v-if="bubbleVisible && !panelVisible"
        type="button"
        class="assistant-bubble"
        @click="panelVisible = true"
      >
        <span>{{ bubbleText }}</span>
      </button>
    </transition>

    <button
      ref="petRef"
      type="button"
      class="assistant-pet"
      :data-mood="currentMood"
      @pointerdown="handlePointerDown"
    >
      <AssistantLive2D
        compact
        :mood="currentMood"
        :animation="currentAnimation"
        :species="petKind"
        :speaking="false"
        :tracking="trackingEnabled"
      />
      <span class="assistant-pet__label">{{ petLabel }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type {
  AssistantAnimation,
  AssistantChatResponse,
  AssistantContext,
  AssistantMood,
  AssistantQuickAction,
} from "@aurora/shared";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";

import { assistantApi } from "../../api/assistant";
import AssistantLive2D from "./AssistantLive2D.vue";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type BubbleOptions = {
  duration?: number;
  animation?: AssistantAnimation;
};

const route = useRoute();
type AssistantSkin = "aurora" | "mint" | "sunset";
type AssistantPetKind = "cat" | "dog";
const petRef = ref<HTMLButtonElement | null>(null);
const messagesRef = ref<HTMLDivElement | null>(null);
const panelVisible = ref(false);
const loading = ref(false);
const prompt = ref("");
const currentMood = ref<AssistantMood>("idle");
const currentAnimation = ref<AssistantAnimation>("idle");
const includePageContext = ref(false);
const autonomyEnabled = ref(loadStoredAutonomyEnabled());
const trackingEnabled = ref(true);
const speaking = ref(false);
const bubbleText = ref("");
const bubbleVisible = ref(false);
const idleLines = ref<string[]>(getDefaultIdleLines());
const petKind = ref<AssistantPetKind>(loadStoredPetKind());
const skin = ref<AssistantSkin>(loadStoredSkin());
const providerLabel = ref("规则模式");
const messages = ref<UiMessage[]>([
  {
    id: createId(),
    role: "assistant",
    content:
      "我已经就位。默认不会自动带上当前页内容，你可以直接聊天；需要页内问答时再打开“已带页文”。",
  },
]);
const quickActions = ref<AssistantQuickAction[]>(
  normalizeQuickActions(buildDefaultActions(route.fullPath)),
);
const dragState = {
  active: false,
  moved: false,
  offsetX: 0,
  offsetY: 0,
};
const position = ref(loadStoredPosition());

let bubbleTimer: number | null = null;
let animationTimer: number | null = null;
let autonomyTimer: number | null = null;

const dockStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
}));

const petLabel = computed(() => {
  if (loading.value) return "思考中";
  return panelVisible.value ? "陪你读" : "问我";
});

const panelSubtitle = computed(() => {
  const modeLabel = includePageContext.value ? "页内问答" : "自由对话";
  const autonomyLabel = autonomyEnabled.value ? "会主动互动" : "仅响应";

  if (loading.value) {
    return `${modeLabel} · 正在组织回答`;
  }

  return `${providerLabel.value} · ${modeLabel} · ${autonomyLabel}`;
});

watch(
  () => route.fullPath,
  () => {
    quickActions.value = normalizeQuickActions(buildDefaultActions(route.fullPath));
    idleLines.value = getDefaultIdleLines();
    if (messages.value.length === 1) {
      messages.value[0] = {
        ...messages.value[0],
        content: includePageContext.value
          ? `我已切换到「${document.title || "当前页面"}」，当前会结合这个页面来回答。`
          : "页面已切换。你可以继续直接提问，不会自动附带这个页面。",
      };
    }
    showBubble(
      includePageContext.value
        ? `到了「${document.title || "当前页面"}」，现在会结合这页来聊。`
        : "页面切换了。我继续待命，不会自动读这页。",
      { animation: "wave", duration: 4200 },
    );
    scheduleAutonomy();
  },
);

watch(panelVisible, () => {
  nextTick(() => {
    clampPosition();
    scrollMessages();
  });
  if (panelVisible.value) {
    bubbleVisible.value = false;
    setAnimation("nod", 1400);
  }
  scheduleAutonomy();
});

watch(includePageContext, (enabled, previous) => {
  if (previous === undefined) return;
  idleLines.value = getDefaultIdleLines();
  showBubble(enabled ? "已切到页内问答模式。" : "已切到自由对话模式。", {
    animation: "nod",
    duration: 3200,
  });
  scheduleAutonomy();
});

watch(autonomyEnabled, () => {
  saveAutonomyEnabled();
  scheduleAutonomy();
});

onMounted(() => {
  clampPosition();
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("resize", clampPosition);
  showBubble("轻点我试试。我会看着你，也会自己冒出一句。", {
    animation: "wave",
    duration: 5200,
  });
  scheduleAutonomy();
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);
  window.removeEventListener("resize", clampPosition);
  clearBubbleTimer();
  clearAnimationTimer();
  clearAutonomyTimer();
});

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultPosition() {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  return {
    x: Math.max(12, window.innerWidth - 108),
    y: Math.max(12, window.innerHeight - 112),
  };
}

function getLegacyDefaultPosition() {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  return {
    x: Math.max(16, window.innerWidth - 104),
    y: Math.max(16, window.innerHeight - 132),
  };
}

function loadStoredPosition() {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  try {
    const raw = window.localStorage.getItem("aurora-reader-assistant-position");
    if (raw) {
      const parsed = JSON.parse(raw) as { x: number; y: number };
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        const legacy = getLegacyDefaultPosition();
        if (
          Math.abs(parsed.x - legacy.x) <= 4 &&
          Math.abs(parsed.y - legacy.y) <= 4
        ) {
          return getDefaultPosition();
        }
        return parsed;
      }
    }
  } catch {
    // ignore broken cache
  }

  return getDefaultPosition();
}

function loadStoredSkin(): AssistantSkin {
  if (typeof window === "undefined") {
    return "aurora";
  }

  const raw = window.localStorage.getItem("aurora-reader-assistant-skin");
  if (raw === "aurora" || raw === "mint" || raw === "sunset") {
    return raw;
  }

  return "aurora";
}

function loadStoredPetKind(): AssistantPetKind {
  if (typeof window === "undefined") {
    return "cat";
  }

  return window.localStorage.getItem("aurora-reader-assistant-pet") === "dog"
    ? "dog"
    : "cat";
}

function loadStoredAutonomyEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  return (
    window.localStorage.getItem("aurora-reader-assistant-autonomy") !== "off"
  );
}

function saveSkin() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("aurora-reader-assistant-skin", skin.value);
}

function savePetKind() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("aurora-reader-assistant-pet", petKind.value);
}

function saveAutonomyEnabled() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    "aurora-reader-assistant-autonomy",
    autonomyEnabled.value ? "on" : "off",
  );
}

function savePosition() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    "aurora-reader-assistant-position",
    JSON.stringify(position.value),
  );
}

function clampPosition() {
  if (typeof window === "undefined") return;
  const width = 96;
  const height = 96;
  position.value = {
    x: Math.min(
      Math.max(12, position.value.x),
      Math.max(12, window.innerWidth - width - 12),
    ),
    y: Math.min(
      Math.max(12, position.value.y),
      Math.max(12, window.innerHeight - height - 12),
    ),
  };
  savePosition();
}

function handlePointerDown(event: PointerEvent) {
  const rect = petRef.value?.getBoundingClientRect();
  dragState.active = true;
  dragState.moved = false;
  dragState.offsetX = event.clientX - (rect?.left ?? position.value.x);
  dragState.offsetY = event.clientY - (rect?.top ?? position.value.y);
  setAnimation("wave", 1800);
}

function handlePointerMove(event: PointerEvent) {
  if (!dragState.active) return;
  dragState.moved = true;
  position.value = {
    x: event.clientX - dragState.offsetX,
    y: event.clientY - dragState.offsetY,
  };
  clampPosition();
}

function handlePointerUp() {
  if (!dragState.active) return;
  const moved = dragState.moved;
  dragState.active = false;
  dragState.moved = false;
  savePosition();
  if (!moved) {
    panelVisible.value = !panelVisible.value;
    showBubble(panelVisible.value ? "我展开了，直接问吧。" : getIdleLine(), {
      animation: panelVisible.value ? "nod" : "wave",
      duration: 3600,
    });
  }
}

function cycleSkin() {
  const skins: AssistantSkin[] = ["aurora", "mint", "sunset"];
  const currentIndex = skins.indexOf(skin.value);
  skin.value = skins[(currentIndex + 1) % skins.length];
  saveSkin();
  showBubble("换了个新皮肤。", { animation: "cheer", duration: 2600 });
}

function cyclePetKind() {
  petKind.value = petKind.value === "cat" ? "dog" : "cat";
  savePetKind();
  showBubble(petKind.value === "cat" ? "换成小猫了。" : "换成小狗了。", {
    animation: "cheer",
    duration: 2800,
  });
}

function toggleAutonomy() {
  autonomyEnabled.value = !autonomyEnabled.value;
  showBubble(autonomyEnabled.value ? "我会更主动一点。" : "我先安静待命。", {
    animation: "nod",
    duration: 2600,
  });
}

function resetConversation() {
  prompt.value = "";
  loading.value = false;
  currentMood.value = "idle";
  currentAnimation.value = "idle";
  messages.value = messages.value.slice(0, 1);
  quickActions.value = normalizeQuickActions(buildDefaultActions(route.fullPath));
  idleLines.value = getDefaultIdleLines();
  showBubble("对话已清空。", { animation: "wave", duration: 2600 });
  scheduleAutonomy();
  nextTick(() => {
    scrollMessages();
  });
}

function buildDefaultActions(path: string): AssistantQuickAction[] {
  if (path.includes("/posts/")) {
    return [
      {
        id: "summary",
        label: "一键总结",
        prompt: "请帮我总结这篇文章的重点。",
      },
      {
        id: "concept",
        label: "解释概念",
        prompt: "请解释这篇文章里最关键的概念。",
      },
      {
        id: "next",
        label: "继续阅读",
        prompt: "请根据当前文章推荐下一步阅读路径。",
      },
    ];
  }

  return [
    {
      id: "focus",
      label: "页面重点",
      prompt: "请告诉我当前页面最值得关注的重点。",
    },
    {
      id: "discover",
      label: "推荐阅读",
      prompt: "请根据当前页面推荐下一步阅读内容。",
    },
  ];
}

function normalizeQuickActions(actions: AssistantQuickAction[]) {
  const seen = new Set<string>();

  return actions.filter((action) => {
    const key = `${action.label}::${action.prompt}`.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getDefaultIdleLines() {
  return includePageContext.value
    ? [
        "我在陪你看这页，想让我抓重点就叫我。",
        "要不要我换个角度解释这页内容？",
        "我可以直接按这页内容给你做总结。",
      ]
    : [
        "直接问我也行，我不会默认带页文。",
        "把段落贴给我，我帮你压缩重点。",
        "想继续看什么主题，跟我说就行。",
      ];
}

function getIdleLine() {
  const pool = idleLines.value.length ? idleLines.value : getDefaultIdleLines();
  return pool[Math.floor(Math.random() * pool.length)] ?? "我在这儿。";
}

function clearBubbleTimer() {
  if (bubbleTimer !== null) {
    window.clearTimeout(bubbleTimer);
    bubbleTimer = null;
  }
}

function clearAnimationTimer() {
  if (animationTimer !== null) {
    window.clearTimeout(animationTimer);
    animationTimer = null;
  }
}

function clearAutonomyTimer() {
  if (autonomyTimer !== null) {
    window.clearTimeout(autonomyTimer);
    autonomyTimer = null;
  }
}

function setAnimation(animation: AssistantAnimation, duration = 0) {
  currentAnimation.value = animation;
  clearAnimationTimer();
  if (duration > 0) {
    animationTimer = window.setTimeout(() => {
      if (!loading.value && !speaking.value) {
        currentAnimation.value = "idle";
      }
    }, duration);
  }
}

function showBubble(text: string, options: BubbleOptions = {}) {
  const normalized = text.trim();
  if (!normalized) return;

  bubbleText.value = normalized;
  bubbleVisible.value = true;

  if (options.animation) {
    setAnimation(options.animation, options.duration ?? 2200);
  }

  clearBubbleTimer();
  bubbleTimer = window.setTimeout(() => {
    bubbleVisible.value = false;
  }, options.duration ?? 4200);
}

function scheduleAutonomy() {
  clearAutonomyTimer();
  if (!autonomyEnabled.value || typeof window === "undefined") {
    return;
  }

  const delay = panelVisible.value
    ? 22_000 + Math.random() * 6_000
    : 14_000 + Math.random() * 10_000;

  autonomyTimer = window.setTimeout(() => {
    if (!loading.value) {
      showBubble(getIdleLine(), {
        animation: panelVisible.value ? "nod" : "wave",
        duration: 4200,
      });
    }
    scheduleAutonomy();
  }, delay);
}

function collectContext(): AssistantContext {
  const shouldIncludePageContext = includePageContext.value;
  const main = shouldIncludePageContext ? document.querySelector("main") : null;
  const rawText = shouldIncludePageContext
    ? (main?.textContent?.replace(/\s+/g, " ").trim() ?? "")
    : "";
  const params = route.params;

  return {
    app: "web",
    route: route.fullPath,
    pageTitle: document.title || "Aurora Blog",
    pageSummary: shouldIncludePageContext ? rawText.slice(0, 260) : undefined,
    content: shouldIncludePageContext ? rawText.slice(0, 2600) : undefined,
    tags: Object.values(params).map((item) => String(item)),
    metadata: {
      includePageContext: shouldIncludePageContext,
      routeName: String(route.name ?? ""),
      pageType: route.fullPath.includes("/posts/")
        ? "post"
        : route.fullPath.replace(/\W+/g, "-") || "home",
    },
  };
}

async function submitPrompt(input = prompt.value) {
  const nextPrompt = input.trim();
  if (!nextPrompt || loading.value) return;

  panelVisible.value = true;
  prompt.value = "";
  loading.value = true;
  currentMood.value = "thinking";
  setAnimation("ponder");
  showBubble(includePageContext.value ? "我先看看这页。" : "我来想想。", {
    animation: "ponder",
    duration: 3600,
  });
  messages.value.push({ id: createId(), role: "user", content: nextPrompt });
  scrollMessages();
  providerLabel.value = "连接中";

  try {
    const response = await assistantApi.chat({
      message: nextPrompt,
      context: collectContext(),
      history: messages.value.slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
      })),
    });

    try {
      applyAssistantResponse(response);
    } catch (error) {
      currentMood.value = "warning";
      providerLabel.value = resolveProviderLabel(response);
      setAnimation("alert", 2800);
      messages.value.push({
        id: createId(),
        role: "assistant",
        content: formatAssistantError(
          error,
          "后端已经返回了内容，但当前页面处理这条响应时出错了。请刷新页面后再试一次。",
        ),
      });
      showBubble("页面处理助手响应时出错了。", {
        animation: "alert",
        duration: 3200,
      });
    }
  } catch (error) {
    currentMood.value = "warning";
    providerLabel.value = "连接失败";
    setAnimation("alert", 2800);
    messages.value.push({
      id: createId(),
      role: "assistant",
      content: formatAssistantError(
        error,
        "我暂时没有连上后端助手。先确认 API 正在运行，再继续问我。",
      ),
    });
    showBubble("助手接口这次没接上。", {
      animation: "alert",
      duration: 3200,
    });
  } finally {
    loading.value = false;
    scrollMessages();
    scheduleAutonomy();
  }
}

function runQuickAction(value: string) {
  void submitPrompt(value);
}

function applyAssistantResponse(response: AssistantChatResponse) {
  currentMood.value = response.mood;
  providerLabel.value = resolveProviderLabel(response);
  quickActions.value = response.actions.length
    ? normalizeQuickActions(response.actions)
    : quickActions.value;
  trackingEnabled.value = response.presence.followCursor;
  idleLines.value = response.presence.idleLines.length
    ? response.presence.idleLines
    : getDefaultIdleLines();
  setAnimation(response.presence.animation, 2800);
  messages.value.push({
    id: createId(),
    role: "assistant",
    content: response.reply,
  });
  showBubble(response.presence.bubbleText, {
    animation: response.presence.animation,
    duration: 5600,
  });
}

function resolveProviderLabel(response: Partial<AssistantChatResponse>) {
  return response.provider === "openai-compatible"
    ? response.model || "兼容模型"
    : "规则模式";
}

function formatAssistantError(error: unknown, fallback: string) {
  const detail = extractAssistantErrorMessage(error);
  return detail ? `${fallback}\n\n${detail}` : fallback;
}

function extractAssistantErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const maybeError = error as {
    message?: unknown;
    response?: { status?: unknown; data?: unknown };
  };
  const status =
    typeof maybeError.response?.status === "number"
      ? maybeError.response.status
      : null;
  const responseMessage = extractErrorText(maybeError.response?.data);
  const ownMessage =
    typeof maybeError.message === "string" ? maybeError.message.trim() : "";

  if (status && responseMessage) {
    return `错误 ${status}: ${responseMessage}`;
  }

  if (status) {
    return `错误 ${status}${ownMessage ? `: ${ownMessage}` : ""}`;
  }

  return responseMessage || ownMessage;
}

function extractErrorText(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => extractErrorText(item))
      .filter(Boolean)
      .join("；");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const message = extractErrorText(record.message);
    if (message) {
      return message;
    }

    const errorText = extractErrorText(record.error);
    if (errorText) {
      return errorText;
    }
  }

  return "";
}

function scrollMessages() {
  nextTick(() => {
    messagesRef.value?.scrollTo({
      top: messagesRef.value.scrollHeight,
      behavior: "smooth",
    });
  });
}
</script>

<style scoped>
.assistant-dock {
  position: fixed;
  z-index: 60;
  width: 96px;
  height: 96px;
  --assistant-accent: #165dff;
  --assistant-accent-strong: #0f46cc;
  --assistant-accent-soft: rgb(22 93 255 / 0.14);
  --assistant-accent-soft-strong: rgb(22 93 255 / 0.24);
  --assistant-panel-bg:
    radial-gradient(
      circle at top right,
      rgb(44 102 255 / 0.24),
      transparent 38%
    ),
    linear-gradient(180deg, rgb(238 243 250 / 0.97), rgb(226 234 244 / 0.97));
  --assistant-pet-bg:
    radial-gradient(
      circle at top,
      rgb(235 241 248 / 0.97),
      rgb(202 216 233 / 0.95)
    ),
    linear-gradient(180deg, rgb(22 93 255 / 0.2), rgb(22 93 255 / 0.12));
  --assistant-face-bg: linear-gradient(
    180deg,
    rgb(242 246 251 / 0.98),
    rgb(205 219 235 / 0.95)
  );
  --assistant-surface: rgb(233 239 246 / 0.97);
  --assistant-surface-2: rgb(225 232 241 / 0.95);
  --assistant-text: rgb(30 39 53 / 0.96);
  --assistant-text-soft: rgb(90 104 123 / 0.94);
  --assistant-border: rgb(88 104 132 / 0.18);
  --assistant-shadow: 0 22px 54px rgb(44 55 78 / 0.16);
  --assistant-pet-shadow: 0 18px 42px rgb(22 93 255 / 0.28);
  --assistant-avatar-skin: rgb(243 212 190);
  --assistant-avatar-skin-shadow: rgb(227 184 153);
  --assistant-avatar-hair: color-mix(
    in srgb,
    var(--assistant-accent) 36%,
    rgb(34 41 58)
  );
  --assistant-avatar-hair-soft: color-mix(
    in srgb,
    var(--assistant-accent) 18%,
    rgb(221 232 249)
  );
  --assistant-avatar-ear: color-mix(
    in srgb,
    var(--assistant-accent) 34%,
    rgb(232 240 252)
  );
  --assistant-avatar-ear-core: color-mix(
    in srgb,
    var(--assistant-accent) 18%,
    rgb(255 224 232)
  );
  --assistant-avatar-coat: color-mix(
    in srgb,
    var(--assistant-accent) 68%,
    rgb(40 49 67)
  );
  --assistant-avatar-coat-soft: color-mix(
    in srgb,
    var(--assistant-accent) 24%,
    rgb(240 245 255)
  );
  --assistant-avatar-eye: rgb(33 41 57 / 0.96);
  --assistant-avatar-blush: rgb(238 150 165 / 0.26);
}

.assistant-dock[data-skin="mint"] {
  --assistant-accent: #0f9f8c;
  --assistant-accent-strong: #0b7c6d;
  --assistant-accent-soft: rgb(15 159 140 / 0.14);
  --assistant-accent-soft-strong: rgb(15 159 140 / 0.24);
  --assistant-panel-bg:
    radial-gradient(
      circle at top right,
      rgb(20 184 166 / 0.24),
      transparent 38%
    ),
    linear-gradient(180deg, rgb(238 246 244 / 0.97), rgb(225 237 233 / 0.97));
  --assistant-pet-bg:
    radial-gradient(
      circle at top,
      rgb(237 246 243 / 0.97),
      rgb(201 227 220 / 0.95)
    ),
    linear-gradient(180deg, rgb(15 159 140 / 0.2), rgb(15 159 140 / 0.12));
  --assistant-face-bg: linear-gradient(
    180deg,
    rgb(243 249 247 / 0.98),
    rgb(202 228 221 / 0.95)
  );
  --assistant-pet-shadow: 0 18px 42px rgb(15 159 140 / 0.28);
}

.assistant-dock[data-skin="sunset"] {
  --assistant-accent: #db5b16;
  --assistant-accent-strong: #b64510;
  --assistant-accent-soft: rgb(219 91 22 / 0.14);
  --assistant-accent-soft-strong: rgb(219 91 22 / 0.24);
  --assistant-panel-bg:
    radial-gradient(
      circle at top right,
      rgb(251 146 60 / 0.24),
      transparent 38%
    ),
    linear-gradient(180deg, rgb(246 240 235 / 0.97), rgb(237 226 217 / 0.97));
  --assistant-pet-bg:
    radial-gradient(
      circle at top,
      rgb(246 240 235 / 0.97),
      rgb(231 207 190 / 0.95)
    ),
    linear-gradient(180deg, rgb(219 91 22 / 0.2), rgb(219 91 22 / 0.12));
  --assistant-face-bg: linear-gradient(
    180deg,
    rgb(249 244 239 / 0.98),
    rgb(231 208 191 / 0.95)
  );
  --assistant-pet-shadow: 0 18px 42px rgb(219 91 22 / 0.26);
}

.assistant-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 14px);
  width: min(468px, calc(100vw - 28px));
  border: 1px solid var(--assistant-border);
  border-radius: 28px;
  background: var(--assistant-panel-bg);
  box-shadow: var(--assistant-shadow);
  backdrop-filter: blur(18px);
  font-size: 13px;
}

.assistant-panel__header,
.assistant-panel__identity,
.assistant-composer__footer,
.assistant-panel__tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assistant-panel__header {
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 18px 12px;
}

.assistant-panel__identity {
  flex: 1;
  min-width: 0;
}

.assistant-panel__tools {
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 0 auto;
  max-width: 272px;
  gap: 8px;
}

.assistant-panel__identity p {
  margin: 4px 0 0;
  color: var(--assistant-text-soft);
  font-size: 12px;
  line-height: 1.45;
}

.assistant-close,
.assistant-reset,
.assistant-skin,
.assistant-send,
.assistant-chip,
.assistant-suggestion,
.assistant-pet {
  border: 0;
  font: inherit;
  white-space: nowrap;
  writing-mode: horizontal-tb;
}

.assistant-close {
  padding: 7px 11px;
  border-radius: 999px;
  background: rgb(15 23 42 / 0.08);
  color: var(--assistant-text);
  cursor: pointer;
  font-size: 12px;
}

.assistant-skin {
  padding: 7px 11px;
  border-radius: 999px;
  background: var(--assistant-accent-soft);
  color: var(--assistant-accent-strong);
  cursor: pointer;
  font-size: 12px;
}

.assistant-reset {
  padding: 7px 11px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--assistant-text) 10%, transparent);
  color: var(--assistant-text-soft);
  cursor: pointer;
  font-size: 12px;
}

.assistant-messages {
  display: grid;
  gap: 9px;
  max-height: 296px;
  padding: 0 20px;
  overflow: auto;
}

.assistant-message {
  display: grid;
  gap: 5px;
  padding: 11px 13px;
  border-radius: 17px;
}

.assistant-message strong {
  font-size: 11px;
  letter-spacing: 0.04em;
}

.assistant-message p {
  margin: 0;
  font-size: 13px;
  line-height: 1.58;
  white-space: pre-wrap;
}

.assistant-message--assistant {
  background: var(--assistant-surface);
  color: var(--assistant-text);
}

.assistant-message--user {
  background: linear-gradient(
    180deg,
    var(--assistant-accent-soft-strong),
    var(--assistant-accent-soft)
  );
  color: var(--assistant-text);
}

.assistant-message--typing {
  border: 1px dashed var(--assistant-accent-soft-strong);
}

.assistant-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px 0;
}

.assistant-chip {
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--assistant-accent-soft);
  color: var(--assistant-accent-strong);
  cursor: pointer;
  font-size: 12px;
}

.assistant-composer {
  display: grid;
  gap: 9px;
  padding: 16px 20px 18px;
}

.assistant-input {
  min-height: 92px;
  padding: 11px 13px;
  border: 1px solid var(--assistant-border);
  border-radius: 18px;
  background: var(--assistant-surface);
  color: var(--assistant-text);
  font: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}

.assistant-composer__footer span {
  color: var(--assistant-text-soft);
  font-size: 11px;
}

.assistant-composer__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.assistant-toggle-chip {
  padding: 6px 11px;
  border: 1px solid var(--assistant-border);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.36);
  color: var(--assistant-text-soft);
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 0.02em;
}

.assistant-toggle-chip[data-active="true"] {
  background: var(--assistant-accent-soft);
  color: var(--assistant-accent-strong);
}

.assistant-bubble {
  position: absolute;
  right: 10px;
  bottom: calc(100% + 12px);
  width: min(360px, calc(100vw - 34px));
  min-width: 236px;
  padding: 13px 16px;
  border: 1px solid rgb(64 255 143 / 0.58);
  border-radius: 18px 18px 8px 18px;
  background:
    linear-gradient(180deg, rgb(7 14 10 / 0.98), rgb(4 8 6 / 0.98)),
    radial-gradient(circle at top left, rgb(72 255 163 / 0.18), transparent 42%);
  color: rgb(113 255 168 / 0.96);
  box-shadow:
    0 14px 32px rgb(0 0 0 / 0.34),
    0 0 0 1px rgb(36 138 82 / 0.18),
    inset 0 1px 0 rgb(127 255 188 / 0.08);
  text-align: left;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.assistant-bubble span {
  display: block;
  line-height: 1.6;
  font-family:
    "JetBrains Mono", "Fira Code", "Cascadia Code", "SFMono-Regular", Consolas,
    monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
  text-shadow: 0 0 10px rgb(80 255 158 / 0.22);
}

.assistant-bubble[data-speaking="true"] {
  box-shadow:
    0 16px 36px rgb(0 0 0 / 0.42),
    0 0 18px rgb(80 255 158 / 0.18),
    inset 0 0 0 1px rgb(64 255 143 / 0.32);
}

.assistant-send {
  padding: 9px 15px;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--assistant-accent-strong),
    var(--assistant-accent)
  );
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}

.assistant-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.assistant-pet {
  display: grid;
  justify-items: center;
  gap: 2px;
  width: 104px;
  padding: 0;
  background: transparent;
  box-shadow: none;
  cursor: grab;
}

.assistant-pet:active {
  cursor: grabbing;
}

.assistant-pet__label {
  padding: 4px 10px;
  border: 1px solid var(--assistant-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--assistant-panel-bg) 62%, white);
  color: var(--assistant-text);
  font-size: 11px;
  font-weight: 700;
}

.assistant-avatar {
  position: relative;
  width: 56px;
  height: 56px;
  pointer-events: none;
}

.assistant-avatar--pet {
  width: 68px;
  height: 68px;
  margin-top: -2px;
}

.assistant-avatar__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.assistant-avatar__float {
  transform-origin: 50% 60%;
  animation: assistant-float 4.6s ease-in-out infinite;
}

.assistant-avatar__halo {
  fill: color-mix(in srgb, var(--assistant-accent) 28%, transparent);
  opacity: 0.9;
}

.assistant-avatar__ear,
.assistant-avatar__ear-core,
.assistant-avatar__hair-back,
.assistant-avatar__hair-front,
.assistant-avatar__fringe,
.assistant-avatar__coat,
.assistant-avatar__collar,
.assistant-avatar__brow,
.assistant-avatar__eye,
.assistant-avatar__mouth,
.assistant-avatar__spark {
  transform-box: fill-box;
  transform-origin: center;
  transition:
    transform 180ms ease,
    opacity 180ms ease,
    stroke 180ms ease;
}

.assistant-avatar__ear {
  fill: var(--assistant-avatar-ear);
}

.assistant-avatar__ear-core {
  fill: var(--assistant-avatar-ear-core);
}

.assistant-avatar__hair-back,
.assistant-avatar__hair-front {
  fill: var(--assistant-avatar-hair);
}

.assistant-avatar__fringe {
  fill: var(--assistant-avatar-hair-soft);
}

.assistant-avatar__head {
  fill: var(--assistant-avatar-skin);
  stroke: color-mix(
    in srgb,
    var(--assistant-avatar-skin-shadow) 80%,
    transparent
  );
  stroke-width: 1.4;
}

.assistant-avatar__neck {
  fill: var(--assistant-avatar-skin-shadow);
}

.assistant-avatar__coat {
  fill: var(--assistant-avatar-coat);
}

.assistant-avatar__collar {
  fill: none;
  stroke: var(--assistant-avatar-coat-soft);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.2;
}

.assistant-avatar__cheek {
  fill: var(--assistant-avatar-blush);
}

.assistant-avatar__eye {
  fill: var(--assistant-avatar-eye);
  animation: blink 4.6s infinite;
}

.assistant-avatar__glint {
  fill: rgb(255 255 255 / 0.92);
}

.assistant-avatar__brow {
  fill: none;
  stroke: color-mix(in srgb, var(--assistant-avatar-eye) 85%, transparent);
  stroke-linecap: round;
  stroke-width: 3;
}

.assistant-avatar__nose {
  fill: color-mix(
    in srgb,
    var(--assistant-avatar-skin-shadow) 80%,
    transparent
  );
}

.assistant-avatar__mouth {
  display: none;
  fill: none;
  stroke: color-mix(in srgb, var(--assistant-avatar-eye) 88%, transparent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.assistant-avatar__mouth--idle {
  display: block;
}

.assistant-avatar__spark {
  display: none;
  fill: var(--assistant-accent);
  opacity: 0.96;
}

.assistant-avatar[data-mood="thinking"] .assistant-avatar__mouth--idle,
.assistant-avatar[data-mood="warning"] .assistant-avatar__mouth--idle,
.assistant-avatar[data-mood="celebrate"] .assistant-avatar__mouth--idle,
.assistant-avatar[data-mood="spark"] .assistant-avatar__mouth--idle {
  display: none;
}

.assistant-avatar[data-mood="thinking"] .assistant-avatar__mouth--thinking,
.assistant-avatar[data-mood="warning"] .assistant-avatar__mouth--warning,
.assistant-avatar[data-mood="celebrate"] .assistant-avatar__mouth--spark,
.assistant-avatar[data-mood="spark"] .assistant-avatar__mouth--spark {
  display: block;
}

.assistant-avatar[data-mood="thinking"] .assistant-avatar__eye {
  transform: translateY(1px) scaleY(0.82);
}

.assistant-avatar[data-mood="thinking"] .assistant-avatar__brow--left {
  transform: translateY(1px) rotate(6deg);
}

.assistant-avatar[data-mood="thinking"] .assistant-avatar__brow--right {
  transform: translateY(1px) rotate(-6deg);
}

.assistant-avatar[data-mood="warning"] .assistant-avatar__brow--left {
  transform: translateY(-1px) rotate(12deg);
}

.assistant-avatar[data-mood="warning"] .assistant-avatar__brow--right {
  transform: translateY(-1px) rotate(-12deg);
}

.assistant-avatar[data-mood="warning"] .assistant-avatar__ear--left {
  transform: rotate(-8deg) translateY(2px);
}

.assistant-avatar[data-mood="warning"] .assistant-avatar__ear--right {
  transform: rotate(8deg) translateY(2px);
}

.assistant-avatar[data-mood="celebrate"] .assistant-avatar__spark,
.assistant-avatar[data-mood="spark"] .assistant-avatar__spark {
  display: block;
}

.assistant-avatar[data-mood="celebrate"] .assistant-avatar__float,
.assistant-avatar[data-mood="spark"] .assistant-avatar__float {
  animation-duration: 3.1s;
}

@media (prefers-color-scheme: dark) {
  .assistant-dock {
    --assistant-panel-bg:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--assistant-accent) 28%, transparent),
        transparent 40%
      ),
      linear-gradient(180deg, rgb(46 55 69 / 0.96), rgb(40 48 60 / 0.96));
    --assistant-pet-bg:
      radial-gradient(
        circle at top,
        rgb(80 92 110 / 0.96),
        rgb(60 71 88 / 0.96)
      ),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--assistant-accent) 18%, transparent),
        rgb(52 61 76 / 0.94)
      );
    --assistant-face-bg: linear-gradient(
      180deg,
      rgb(86 99 118 / 0.98),
      rgb(65 76 92 / 0.96)
    );
    --assistant-surface: rgb(67 78 95 / 0.95);
    --assistant-surface-2: rgb(60 71 88 / 0.95);
    --assistant-text: rgb(241 245 252 / 0.96);
    --assistant-text-soft: rgb(205 214 228 / 0.92);
    --assistant-border: rgb(186 198 214 / 0.18);
    --assistant-shadow: 0 24px 56px rgb(7 10 18 / 0.22);
  }

  .assistant-close {
    background: rgb(255 255 255 / 0.14);
  }

  .assistant-input {
    background: rgb(58 69 85 / 0.9);
  }
}

.assistant-panel-fade-enter-active,
.assistant-panel-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.assistant-panel-fade-enter-from,
.assistant-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.assistant-bubble-fade-enter-active,
.assistant-bubble-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.assistant-bubble-fade-enter-from,
.assistant-bubble-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

@keyframes blink {
  0%,
  44%,
  48%,
  100% {
    transform: scaleY(1);
  }

  46% {
    transform: scaleY(0.12);
  }
}

@keyframes assistant-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-2px);
  }
}

@media (max-width: 720px) {
  .assistant-panel {
    right: auto;
    left: 0;
    bottom: calc(100% + 12px);
    width: min(398px, calc(100vw - 20px));
  }

  .assistant-pet {
    width: 82px;
  }
}
</style>
