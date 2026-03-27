<template>
  <div
    ref="rootRef"
    class="assistant-live2d"
    :class="rootClasses"
    :style="rootStyle"
  >
    <div class="assistant-live2d__aura" />
    <div class="assistant-live2d__sparkles">
      <span
        v-for="index in sparkleCount"
        :key="index"
        class="assistant-live2d__sparkle"
        :style="buildSparkleStyle(index)"
      />
    </div>
    <div class="assistant-live2d__frame">
      <div
        v-if="species === 'live2d'"
        ref="hostRef"
        class="assistant-live2d__canvas"
      />

      <svg
        v-else-if="species === 'cat'"
        class="assistant-pet-svg assistant-pet-svg--cat"
        viewBox="0 0 220 240"
        aria-hidden="true"
      >
        <g class="assistant-pet-svg__shadow">
          <ellipse cx="110" cy="212" rx="56" ry="15" />
        </g>
        <g class="assistant-pet-svg__tail assistant-pet-svg__tail--cat">
          <path
            d="M166 167c26 5 36-10 32-26-4-14-18-20-31-10 11-24-10-46-35-31"
          />
        </g>
        <g class="assistant-pet-svg__body">
          <path
            class="assistant-pet-svg__fur assistant-pet-svg__fur--base"
            d="M67 177c0-36 20-62 43-62s43 26 43 62v18H67z"
          />
          <path
            class="assistant-pet-svg__fur assistant-pet-svg__fur--chest"
            d="M93 141c8-7 26-7 34 0v54H93z"
          />
          <ellipse
            class="assistant-pet-svg__paw assistant-pet-svg__paw--left"
            cx="84"
            cy="196"
            rx="14"
            ry="16"
          />
          <ellipse
            class="assistant-pet-svg__paw assistant-pet-svg__paw--right"
            cx="136"
            cy="196"
            rx="14"
            ry="16"
          />
        </g>
        <g class="assistant-pet-svg__head">
          <path
            class="assistant-pet-svg__ear assistant-pet-svg__ear--left"
            d="M82 61L61 33l-7 42z"
          />
          <path
            class="assistant-pet-svg__ear assistant-pet-svg__ear--right"
            d="M138 61l28 14-9-42z"
          />
          <path
            class="assistant-pet-svg__ear-core assistant-pet-svg__ear-core--left"
            d="M81 60L66 40l-4 28z"
          />
          <path
            class="assistant-pet-svg__ear-core assistant-pet-svg__ear-core--right"
            d="M139 60l20 9-6-28z"
          />
          <circle
            class="assistant-pet-svg__fur assistant-pet-svg__fur--base"
            cx="110"
            cy="98"
            r="51"
          />
          <ellipse
            class="assistant-pet-svg__muzzle"
            cx="110"
            cy="118"
            rx="27"
            ry="20"
          />
          <path
            class="assistant-pet-svg__patch"
            d="M81 81c9-11 23-11 31-6-5 13-13 23-23 28-7-4-11-13-8-22z"
          />
          <g class="assistant-pet-svg__eyes">
            <ellipse
              class="assistant-pet-svg__eye-base"
              cx="92"
              cy="100"
              rx="10"
              ry="11"
            />
            <ellipse
              class="assistant-pet-svg__eye-base"
              cx="128"
              cy="100"
              rx="10"
              ry="11"
            />
            <ellipse
              class="assistant-pet-svg__pupil"
              cx="92"
              cy="101"
              rx="4.6"
              ry="5.6"
            />
            <ellipse
              class="assistant-pet-svg__pupil"
              cx="128"
              cy="101"
              rx="4.6"
              ry="5.6"
            />
            <circle class="assistant-pet-svg__glint" cx="94" cy="98" r="1.8" />
            <circle class="assistant-pet-svg__glint" cx="130" cy="98" r="1.8" />
          </g>
          <path class="assistant-pet-svg__nose" d="M110 110l-7 7h14z" />
          <path
            class="assistant-pet-svg__mouth assistant-pet-svg__mouth--cat"
            d="M104 118c2 6 6 9 6 9s4-3 6-9"
          />
          <path
            class="assistant-pet-svg__whisker"
            d="M81 118c-13-1-20 2-29 6"
          />
          <path
            class="assistant-pet-svg__whisker"
            d="M81 125c-11 2-18 6-24 12"
          />
          <path
            class="assistant-pet-svg__whisker"
            d="M139 118c13-1 20 2 29 6"
          />
          <path
            class="assistant-pet-svg__whisker"
            d="M139 125c11 2 18 6 24 12"
          />
          <ellipse
            class="assistant-pet-svg__cheek"
            cx="79"
            cy="120"
            rx="10"
            ry="7"
          />
          <ellipse
            class="assistant-pet-svg__cheek"
            cx="141"
            cy="120"
            rx="10"
            ry="7"
          />
        </g>
      </svg>

      <svg
        v-else
        class="assistant-pet-svg assistant-pet-svg--dog"
        viewBox="0 0 220 240"
        aria-hidden="true"
      >
        <g class="assistant-pet-svg__shadow">
          <ellipse cx="110" cy="212" rx="58" ry="15" />
        </g>
        <g class="assistant-pet-svg__tail assistant-pet-svg__tail--dog">
          <path
            d="M160 169c30-1 43-22 34-36-7-11-22-12-32-2 7-27-18-37-37-24"
          />
        </g>
        <g class="assistant-pet-svg__body">
          <path
            class="assistant-pet-svg__fur assistant-pet-svg__fur--dog"
            d="M62 178c0-36 22-62 48-62s48 26 48 62v17H62z"
          />
          <path
            class="assistant-pet-svg__fur assistant-pet-svg__fur--dog-belly"
            d="M89 144c9-8 33-8 42 0v51H89z"
          />
          <ellipse
            class="assistant-pet-svg__paw assistant-pet-svg__paw--left"
            cx="83"
            cy="197"
            rx="14"
            ry="17"
          />
          <ellipse
            class="assistant-pet-svg__paw assistant-pet-svg__paw--right"
            cx="138"
            cy="197"
            rx="14"
            ry="17"
          />
        </g>
        <g class="assistant-pet-svg__head">
          <path
            class="assistant-pet-svg__ear assistant-pet-svg__ear--dog-left"
            d="M83 63c-19-7-29 6-28 24 1 19 15 33 31 35z"
          />
          <path
            class="assistant-pet-svg__ear assistant-pet-svg__ear--dog-right"
            d="M137 63c19-7 29 6 28 24-1 19-15 33-31 35z"
          />
          <circle
            class="assistant-pet-svg__fur assistant-pet-svg__fur--dog"
            cx="110"
            cy="96"
            r="52"
          />
          <ellipse
            class="assistant-pet-svg__muzzle assistant-pet-svg__muzzle--dog"
            cx="110"
            cy="120"
            rx="31"
            ry="23"
          />
          <path
            class="assistant-pet-svg__patch assistant-pet-svg__patch--dog"
            d="M127 77c17-8 28 7 24 23-5 18-22 25-36 24 0-17 3-38 12-47z"
          />
          <g class="assistant-pet-svg__eyes">
            <ellipse
              class="assistant-pet-svg__eye-base"
              cx="91"
              cy="98"
              rx="10"
              ry="11"
            />
            <ellipse
              class="assistant-pet-svg__eye-base"
              cx="128"
              cy="98"
              rx="10"
              ry="11"
            />
            <ellipse
              class="assistant-pet-svg__pupil"
              cx="91"
              cy="99"
              rx="4.6"
              ry="5.6"
            />
            <ellipse
              class="assistant-pet-svg__pupil"
              cx="128"
              cy="99"
              rx="4.6"
              ry="5.6"
            />
            <circle class="assistant-pet-svg__glint" cx="93" cy="96" r="1.8" />
            <circle class="assistant-pet-svg__glint" cx="130" cy="96" r="1.8" />
          </g>
          <ellipse
            class="assistant-pet-svg__nose assistant-pet-svg__nose--dog"
            cx="110"
            cy="112"
            rx="8"
            ry="6"
          />
          <path
            class="assistant-pet-svg__mouth assistant-pet-svg__mouth--dog"
            d="M98 121c4 8 12 12 12 12s8-4 12-12"
          />
          <ellipse
            class="assistant-pet-svg__cheek"
            cx="80"
            cy="120"
            rx="10"
            ry="7"
          />
          <ellipse
            class="assistant-pet-svg__cheek"
            cx="140"
            cy="120"
            rx="10"
            ry="7"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssistantAnimation, AssistantMood } from "@aurora/shared";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

type AssistantSpecies = "cat" | "dog" | "live2d";

const props = withDefaults(
  defineProps<{
    mood: AssistantMood;
    animation?: AssistantAnimation;
    compact?: boolean;
    speaking?: boolean;
    tracking?: boolean;
    species?: AssistantSpecies;
    modelPath?: string;
  }>(),
  {
    animation: "idle",
    compact: false,
    speaking: false,
    tracking: true,
    species: "cat",
    modelPath: "/live2d/shizuku/aurora-shizuku.model.json",
  },
);

declare global {
  interface Window {
    PIXI?: {
      Application: new (options: Record<string, unknown>) => {
        view: HTMLCanvasElement;
        renderer: { resize: (width: number, height: number) => void };
        stage: { addChild: (child: unknown) => void };
        destroy: (
          removeView?: boolean,
          stageOptions?: { children?: boolean },
        ) => void;
      };
      live2d?: {
        Live2DModel: {
          from: (path: string) => Promise<{
            anchor: { set: (x: number, y?: number) => void };
            scale: { set: (x: number, y?: number) => void };
            getLocalBounds: () => { width: number; height: number };
            motion?: (group: string) => void;
            destroy?: () => void;
            x: number;
            y: number;
            interactive: boolean;
          }>;
        };
      };
    };
    Live2D?: unknown;
    __assistantLive2DLoader?: Promise<void>;
  }
}

const rootRef = ref<HTMLDivElement | null>(null);
const hostRef = ref<HTMLDivElement | null>(null);

let app: {
  view: HTMLCanvasElement;
  renderer: { resize: (width: number, height: number) => void };
  stage: { addChild: (child: unknown) => void };
  destroy: (
    removeView?: boolean,
    stageOptions?: { children?: boolean },
  ) => void;
} | null = null;

let model: {
  anchor: { set: (x: number, y?: number) => void };
  scale: { set: (x: number, y?: number) => void };
  getLocalBounds: () => { width: number; height: number };
  motion?: (group: string) => void;
  destroy?: () => void;
  x: number;
  y: number;
  interactive: boolean;
} | null = null;

let resizeObserver: ResizeObserver | null = null;
let animationFrame = 0;
let destroyed = false;
let lastMotionAt = 0;
let lastPointerAt = 0;
let idlePhase = Math.random() * Math.PI * 2;

const lookX = ref(0);
const lookY = ref(0);
const targetLookX = ref(0);
const targetLookY = ref(0);
const idleLift = ref(0);
const idleTilt = ref(0);
const pawLift = ref(0);

const species = computed(() => props.species);

const rootClasses = computed(() => [
  `assistant-live2d--${props.mood}`,
  `assistant-live2d--${props.animation}`,
  `assistant-live2d--${species.value}`,
  {
    "assistant-live2d--compact": props.compact,
    "assistant-live2d--speaking": props.speaking,
    "assistant-live2d--tracking": props.tracking,
  },
]);

const rootStyle = computed(() => ({
  "--assistant-look-x": `${lookX.value.toFixed(3)}`,
  "--assistant-look-y": `${lookY.value.toFixed(3)}`,
  "--assistant-idle-lift": `${idleLift.value.toFixed(2)}px`,
  "--assistant-idle-tilt": `${idleTilt.value.toFixed(2)}deg`,
  "--assistant-paw-lift": `${pawLift.value.toFixed(2)}px`,
}));

const sparkleCount = computed(() => {
  if (props.mood === "celebrate") return 6;
  if (props.mood === "spark") return 5;
  if (props.speaking) return 4;
  return 3;
});

function ensureScript(src: string, marker: string) {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-live2d-script="${marker}"]`,
  );
  if (existing) {
    if (existing.dataset.loaded === "true") {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`failed to load ${marker}`)),
        { once: true },
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.live2dScript = marker;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error(`failed to load ${marker}`)),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

function ensureCubism2Runtime() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is unavailable"));
  }

  if (window.Live2D && window.PIXI?.live2d?.Live2DModel) {
    return Promise.resolve();
  }

  if (!window.__assistantLive2DLoader) {
    window.__assistantLive2DLoader = (async () => {
      await ensureScript("/live2d/live2d.min.js", "cubism2-runtime");
      await ensureScript("/live2d/pixi.min.js", "pixi");
      await ensureScript("/live2d/cubism2.min.js", "pixi-live2d");
    })();
  }

  return window.__assistantLive2DLoader;
}

function fitModel() {
  if (!app || !model || !hostRef.value) return;

  const width = Math.max(hostRef.value.clientWidth, 1);
  const height = Math.max(hostRef.value.clientHeight, 1);
  app.renderer.resize(width, height);

  const bounds = model.getLocalBounds();
  const scale = Math.min(
    (width * 0.88) / Math.max(bounds.width, 1),
    (height * 0.92) / Math.max(bounds.height, 1),
  );
  model.scale.set(scale, scale);
  model.x = width / 2;
  model.y = height * 0.98;
}

function resolveMotionGroup(
  animation: AssistantAnimation,
  mood: AssistantMood,
) {
  if (
    animation === "wave" ||
    animation === "nod" ||
    animation === "cheer" ||
    animation === "alert" ||
    mood === "spark" ||
    mood === "celebrate" ||
    mood === "warning"
  ) {
    return "tap_body";
  }

  return "idle";
}

function triggerMotion(force = false) {
  if (species.value !== "live2d" || !model?.motion) return;

  const now = Date.now();
  if (!force && now - lastMotionAt < 1300) {
    return;
  }

  try {
    model.motion(resolveMotionGroup(props.animation, props.mood));
    lastMotionAt = now;
  } catch {
    // ignore runtime motion errors
  }
}

function teardownLive2D() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  model?.destroy?.();
  model = null;
  app?.destroy(true, { children: true });
  app = null;
  hostRef.value?.replaceChildren();
}

function handlePointerMove(event: PointerEvent) {
  if (!props.tracking || !rootRef.value) return;

  const rect = rootRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  targetLookX.value = Math.max(
    -1,
    Math.min(1, (event.clientX - centerX) / Math.max(rect.width * 0.72, 1)),
  );
  targetLookY.value = Math.max(
    -1,
    Math.min(1, (event.clientY - centerY) / Math.max(rect.height * 0.8, 1)),
  );
  lastPointerAt = Date.now();
}

function animateStage() {
  idlePhase += props.speaking ? 0.14 : 0.055;
  const pointerExpired = Date.now() - lastPointerAt > 1400;

  if (pointerExpired) {
    targetLookX.value *= 0.92;
    targetLookY.value *= 0.92;
  }

  lookX.value += (targetLookX.value - lookX.value) * 0.08;
  lookY.value += (targetLookY.value - lookY.value) * 0.08;

  const baseLift = Math.sin(idlePhase) * (props.compact ? 2.8 : 2.1);
  const speakingLift = props.speaking ? Math.sin(idlePhase * 3.4) * 2.1 : 0;
  idleLift.value = baseLift + speakingLift;
  idleTilt.value = Math.sin(idlePhase * 0.72) * (props.speaking ? 2.8 : 1.6);

  const waving =
    props.animation === "wave" || props.animation === "cheer" || props.speaking;
  pawLift.value = waving ? 9 + Math.sin(idlePhase * 2.8) * 4 : 0;

  animationFrame = window.requestAnimationFrame(animateStage);
}

async function initLive2D() {
  if (species.value !== "live2d" || !hostRef.value) return;

  await ensureCubism2Runtime();
  const PIXI = window.PIXI;
  const Live2DModel = window.PIXI?.live2d?.Live2DModel;

  if (!PIXI || !Live2DModel || destroyed || !hostRef.value) {
    return;
  }

  app = new PIXI.Application({
    width: Math.max(hostRef.value.clientWidth, 1),
    height: Math.max(hostRef.value.clientHeight, 1),
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });

  hostRef.value.replaceChildren(app.view);

  model = (await Live2DModel.from(props.modelPath)) as typeof model;

  if (destroyed || !app || !model) {
    teardownLive2D();
    return;
  }

  model.anchor.set(0.5, 0.92);
  model.interactive = false;
  app.stage.addChild(model);
  fitModel();
  triggerMotion(true);

  resizeObserver = new ResizeObserver(() => {
    fitModel();
  });
  resizeObserver.observe(hostRef.value);
}

function buildSparkleStyle(index: number) {
  const angle = 30 + index * 36;
  const distance = 20 + (index % 3) * 10 + (props.compact ? 8 : 0);
  const delay = `${index * 0.28}s`;
  const duration = `${3.2 + (index % 3) * 0.5}s`;

  return {
    "--assistant-sparkle-angle": `${angle}deg`,
    "--assistant-sparkle-distance": `${distance}px`,
    "--assistant-sparkle-delay": delay,
    "--assistant-sparkle-duration": duration,
  };
}

watch(
  () => [props.mood, props.animation] as const,
  () => {
    triggerMotion();
  },
);

watch(
  () => species.value,
  async (nextSpecies) => {
    teardownLive2D();
    if (nextSpecies === "live2d") {
      await initLive2D();
    }
  },
);

onMounted(() => {
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  animationFrame = window.requestAnimationFrame(animateStage);
  void initLive2D();
});

onBeforeUnmount(() => {
  destroyed = true;
  window.removeEventListener("pointermove", handlePointerMove);
  window.cancelAnimationFrame(animationFrame);
  teardownLive2D();
});
</script>

<style scoped>
.assistant-live2d {
  position: relative;
  width: 88px;
  height: 94px;
  pointer-events: none;
  user-select: none;
  --assistant-aura: rgb(101 163 255 / 0.32);
  --assistant-spark: rgb(255 215 122 / 0.9);
  --assistant-fur-primary: #f6c27a;
  --assistant-fur-secondary: #fff4df;
  --assistant-fur-tertiary: #915e2c;
  --assistant-feature: #253247;
  --assistant-cheek: rgb(255 173 185 / 0.58);
}

.assistant-live2d--compact {
  width: 122px;
  height: 128px;
}

.assistant-live2d--cat {
  --assistant-fur-primary: #f4bb6f;
  --assistant-fur-secondary: #fff4df;
  --assistant-fur-tertiary: #8f5729;
}

.assistant-live2d--dog {
  --assistant-fur-primary: #d8b085;
  --assistant-fur-secondary: #fff6ea;
  --assistant-fur-tertiary: #8d5b35;
}

.assistant-live2d--thinking {
  --assistant-aura: rgb(112 153 255 / 0.28);
  --assistant-spark: rgb(164 194 255 / 0.88);
}

.assistant-live2d--spark,
.assistant-live2d--celebrate {
  --assistant-aura: rgb(255 177 94 / 0.34);
  --assistant-spark: rgb(255 221 140 / 0.94);
}

.assistant-live2d--warning {
  --assistant-aura: rgb(255 127 127 / 0.32);
  --assistant-spark: rgb(255 173 173 / 0.9);
}

.assistant-live2d__frame {
  position: relative;
  width: 100%;
  height: 100%;
  transform: translate3d(
      calc(var(--assistant-look-x) * 4px),
      calc(var(--assistant-look-y) * 2px + var(--assistant-idle-lift)),
      0
    )
    rotate(var(--assistant-idle-tilt));
  transform-origin: 50% 85%;
  transition: transform 180ms ease;
}

.assistant-live2d__canvas {
  position: relative;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 16px 26px rgb(28 41 68 / 0.14));
}

.assistant-live2d__aura {
  position: absolute;
  inset: 12% 8% 8%;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 30%, var(--assistant-aura), transparent 56%),
    radial-gradient(circle at 50% 88%, rgb(255 255 255 / 0.22), transparent 62%);
  filter: blur(14px);
  opacity: 0.96;
  transform: scale(0.94);
  animation: assistant-aura 4.8s ease-in-out infinite;
}

.assistant-live2d__sparkles {
  position: absolute;
  inset: 0;
}

.assistant-live2d__sparkle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    var(--assistant-spark),
    rgb(255 255 255 / 0.12)
  );
  opacity: 0.52;
  transform: rotate(var(--assistant-sparkle-angle))
    translateY(calc(var(--assistant-sparkle-distance) * -1)) scale(0.78);
  transform-origin: center 32px;
  animation:
    assistant-sparkle var(--assistant-sparkle-duration) ease-in-out infinite,
    assistant-sparkle-opacity 2.8s ease-in-out infinite;
  animation-delay: var(--assistant-sparkle-delay);
}

.assistant-pet-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 16px 20px rgb(23 35 57 / 0.18));
}

.assistant-pet-svg__shadow ellipse {
  fill: rgb(47 60 85 / 0.14);
}

.assistant-pet-svg__tail {
  fill: none;
  stroke: var(--assistant-fur-primary);
  stroke-linecap: round;
  stroke-width: 16;
  transform-origin: 148px 168px;
  animation: tail-wag 2.3s ease-in-out infinite;
}

.assistant-pet-svg__tail--dog {
  stroke-width: 18;
  animation-duration: 1.8s;
}

.assistant-pet-svg__fur--base,
.assistant-pet-svg__fur--dog {
  fill: var(--assistant-fur-primary);
}

.assistant-pet-svg__fur--chest,
.assistant-pet-svg__fur--dog-belly {
  fill: var(--assistant-fur-secondary);
}

.assistant-pet-svg__patch {
  fill: color-mix(in srgb, var(--assistant-fur-tertiary) 82%, black);
}

.assistant-pet-svg__muzzle {
  fill: var(--assistant-fur-secondary);
}

.assistant-pet-svg__muzzle--dog {
  fill: color-mix(in srgb, var(--assistant-fur-secondary) 92%, white);
}

.assistant-pet-svg__ear {
  fill: var(--assistant-fur-primary);
}

.assistant-pet-svg__ear-core {
  fill: rgb(255 204 212 / 0.92);
}

.assistant-pet-svg__ear--left,
.assistant-pet-svg__ear-core--left {
  transform-origin: 74px 62px;
  animation: ear-twitch-left 4.8s ease-in-out infinite;
}

.assistant-pet-svg__ear--right,
.assistant-pet-svg__ear-core--right,
.assistant-pet-svg__ear--dog-right {
  transform-origin: 144px 62px;
  animation: ear-twitch-right 4.8s ease-in-out infinite;
}

.assistant-pet-svg__ear--dog-left {
  transform-origin: 85px 72px;
  animation: dog-ear-left 4.8s ease-in-out infinite;
}

.assistant-pet-svg__ear--dog-right {
  fill: color-mix(
    in srgb,
    var(--assistant-fur-tertiary) 70%,
    var(--assistant-fur-primary)
  );
}

.assistant-pet-svg__paw {
  fill: color-mix(in srgb, var(--assistant-fur-primary) 88%, white);
}

.assistant-pet-svg__paw--left {
  transform-origin: 84px 196px;
  transform: translateY(calc(var(--assistant-paw-lift) * -1));
}

.assistant-pet-svg__eye-base {
  fill: rgb(41 49 64 / 0.16);
}

.assistant-pet-svg__eyes {
  transform-origin: 110px 100px;
  animation: blink 4.8s infinite;
}

.assistant-pet-svg__pupil {
  fill: var(--assistant-feature);
  transform: translate(
    calc(var(--assistant-look-x) * 2px),
    calc(var(--assistant-look-y) * 2px)
  );
  transition: transform 120ms ease;
}

.assistant-pet-svg__glint {
  fill: rgb(255 255 255 / 0.92);
}

.assistant-pet-svg__nose {
  fill: rgb(69 54 57 / 0.94);
}

.assistant-pet-svg__nose--dog {
  fill: rgb(47 39 41 / 0.96);
}

.assistant-pet-svg__mouth {
  fill: none;
  stroke: color-mix(in srgb, var(--assistant-feature) 88%, transparent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}

.assistant-pet-svg__whisker {
  fill: none;
  stroke: rgb(111 90 94 / 0.65);
  stroke-linecap: round;
  stroke-width: 2.4;
}

.assistant-pet-svg__cheek {
  fill: var(--assistant-cheek);
}

.assistant-live2d--speaking .assistant-pet-svg__mouth {
  animation: mouth-talk 0.28s ease-in-out infinite alternate;
}

.assistant-live2d--wave .assistant-pet-svg__paw--left,
.assistant-live2d--cheer .assistant-pet-svg__paw--left {
  animation: paw-wave 0.7s ease-in-out infinite alternate;
}

.assistant-live2d--warning .assistant-pet-svg__tail {
  animation-duration: 0.95s;
}

.assistant-live2d--speaking .assistant-live2d__aura {
  animation-duration: 1.2s;
}

.assistant-live2d--speaking .assistant-live2d__frame {
  transform: translate3d(
      calc(var(--assistant-look-x) * 5px),
      calc(var(--assistant-look-y) * 3px + var(--assistant-idle-lift)),
      0
    )
    rotate(calc(var(--assistant-idle-tilt) * 1.15)) scale(1.02);
}

.assistant-live2d :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

@keyframes assistant-aura {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(0.92);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes assistant-sparkle {
  0%,
  100% {
    transform: rotate(var(--assistant-sparkle-angle))
      translateY(calc(var(--assistant-sparkle-distance) * -1)) scale(0.72);
  }

  50% {
    transform: rotate(calc(var(--assistant-sparkle-angle) + 12deg))
      translateY(calc((var(--assistant-sparkle-distance) + 6px) * -1))
      scale(1.08);
  }
}

@keyframes assistant-sparkle-opacity {
  0%,
  100% {
    opacity: 0.18;
  }

  50% {
    opacity: 0.72;
  }
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

@keyframes tail-wag {
  0%,
  100% {
    transform: rotate(-6deg);
  }

  50% {
    transform: rotate(10deg);
  }
}

@keyframes ear-twitch-left {
  0%,
  100% {
    transform: rotate(-4deg);
  }

  50% {
    transform: rotate(-10deg);
  }
}

@keyframes ear-twitch-right {
  0%,
  100% {
    transform: rotate(4deg);
  }

  50% {
    transform: rotate(10deg);
  }
}

@keyframes dog-ear-left {
  0%,
  100% {
    transform: rotate(2deg);
  }

  50% {
    transform: rotate(9deg);
  }
}

@keyframes paw-wave {
  0% {
    transform: translateY(calc(var(--assistant-paw-lift) * -1)) rotate(-6deg);
  }

  100% {
    transform: translateY(calc((var(--assistant-paw-lift) + 8px) * -1))
      rotate(12deg);
  }
}

@keyframes mouth-talk {
  0% {
    transform: scaleY(0.92);
  }

  100% {
    transform: scaleY(1.14);
  }
}
</style>
