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
        v-if="showWorkbench"
        class="assistant-workbench assistant-workbench--back"
        aria-hidden="true"
      >
        <div class="assistant-workbench__desk-shadow" />
        <div class="assistant-workbench__desk-top" />
        <div class="assistant-workbench__desk-edge" />
        <div class="assistant-workbench__float-window">
          <span
            v-for="index in 4"
            :key="`window-${index}`"
            class="assistant-workbench__float-line"
            :style="buildWorkbenchLineStyle(index)"
          />
        </div>
        <div class="assistant-workbench__mug">
          <span class="assistant-workbench__steam assistant-workbench__steam--1" />
          <span class="assistant-workbench__steam assistant-workbench__steam--2" />
        </div>
      </div>

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
            class="assistant-pet-svg__shine"
            d="M86 77c10-12 29-18 44-14 7 2 12 6 16 11-11-4-25-2-38 5-9 5-15 11-20 20-8-4-10-14-2-22z"
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
            class="assistant-pet-svg__shine"
            d="M82 74c13-14 37-20 57-11 7 3 11 7 13 12-10-3-22-1-34 5-12 6-22 16-28 28-10-5-12-22-8-34z"
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

      <div
        v-if="showWorkbench"
        class="assistant-workbench assistant-workbench--front"
        aria-hidden="true"
      >
        <div class="assistant-workbench__laptop">
          <div class="assistant-workbench__screen">
            <span class="assistant-workbench__screen-glow" />
            <span
              v-for="index in 6"
              :key="`code-${index}`"
              class="assistant-workbench__code-line"
              :style="buildWorkbenchLineStyle(index)"
            />
          </div>
          <div class="assistant-workbench__camera" />
          <div class="assistant-workbench__hinge" />
          <div class="assistant-workbench__keyboard">
            <span
              v-for="index in 4"
              :key="`key-${index}`"
              class="assistant-workbench__key-row"
            />
          </div>
        </div>
        <div class="assistant-workbench__pad">
          <span class="assistant-workbench__pad-dot" />
        </div>
      </div>

      <div v-if="showPhone" class="assistant-prop assistant-prop--phone" aria-hidden="true">
        <div class="assistant-prop__phone">
          <span class="assistant-prop__phone-camera" />
          <span class="assistant-prop__phone-glow" />
          <span
            v-for="index in 3"
            :key="`phone-${index}`"
            class="assistant-prop__phone-line"
            :style="buildWorkbenchLineStyle(index)"
          />
        </div>
      </div>

      <div v-if="showSmoke" class="assistant-prop assistant-prop--smoke" aria-hidden="true">
        <div class="assistant-prop__cigarette">
          <span class="assistant-prop__ember" />
        </div>
        <span class="assistant-prop__smoke assistant-prop__smoke--1" />
        <span class="assistant-prop__smoke assistant-prop__smoke--2" />
        <span class="assistant-prop__smoke assistant-prop__smoke--3" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssistantAnimation, AssistantMood } from "@aurora/shared";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

type AssistantSpecies = "cat" | "dog" | "live2d";
type AssistantWorkMode = "idle" | "coding" | "review" | "sleep";
type AssistantScene = "none" | "laptop" | "phone" | "smoke";

const props = withDefaults(
  defineProps<{
    mood: AssistantMood;
    animation?: AssistantAnimation;
    compact?: boolean;
    speaking?: boolean;
    tracking?: boolean;
    workMode?: AssistantWorkMode;
    scene?: AssistantScene;
    species?: AssistantSpecies;
    modelPath?: string;
  }>(),
  {
    animation: "idle",
    compact: false,
    speaking: false,
    tracking: true,
    workMode: "idle",
    scene: "none",
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
const rightPawLift = ref(0);

const species = computed(() => props.species);

const rootClasses = computed(() => [
  `assistant-live2d--${props.mood}`,
  `assistant-live2d--${props.animation}`,
  `assistant-live2d--${species.value}`,
  `assistant-live2d--work-${props.workMode}`,
  {
    "assistant-live2d--compact": props.compact,
    "assistant-live2d--speaking": props.speaking,
    "assistant-live2d--tracking": props.tracking,
    "assistant-live2d--scene-phone": props.scene === "phone",
    "assistant-live2d--scene-smoke": props.scene === "smoke",
  },
]);

const showWorkbench = computed(
  () => props.compact && species.value !== "live2d" && props.scene === "laptop",
);
const showPhone = computed(
  () => props.compact && species.value !== "live2d" && props.scene === "phone",
);
const showSmoke = computed(
  () => props.compact && species.value !== "live2d" && props.scene === "smoke",
);

const rootStyle = computed(() => ({
  "--assistant-look-x": `${lookX.value.toFixed(3)}`,
  "--assistant-look-y": `${lookY.value.toFixed(3)}`,
  "--assistant-idle-lift": `${idleLift.value.toFixed(2)}px`,
  "--assistant-idle-tilt": `${idleTilt.value.toFixed(2)}deg`,
  "--assistant-paw-lift": `${pawLift.value.toFixed(2)}px`,
  "--assistant-right-paw-lift": `${rightPawLift.value.toFixed(2)}px`,
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

  const waving = props.animation === "wave" || props.animation === "cheer";
  const coding =
    props.workMode === "coding" ||
    props.animation === "ponder" ||
    props.speaking;
  const reviewing = props.workMode === "review";

  if (waving) {
    pawLift.value = 9 + Math.sin(idlePhase * 2.8) * 4;
    rightPawLift.value = 0;
  } else if (coding) {
    pawLift.value = 4 + Math.sin(idlePhase * 5.4) * 2.8;
    rightPawLift.value = 4 + Math.cos(idlePhase * 5.4) * 2.8;
  } else if (reviewing) {
    pawLift.value = 1.2 + Math.sin(idlePhase * 1.4) * 1.1;
    rightPawLift.value = Math.cos(idlePhase * 1.4) * 0.8;
  } else {
    pawLift.value = 0;
    rightPawLift.value = 0;
  }

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

function buildWorkbenchLineStyle(index: number) {
  const widths = ["62%", "46%", "74%", "38%", "68%", "52%"];
  const offsets = ["10%", "16%", "10%", "22%", "10%", "18%"];

  return {
    "--assistant-line-width": widths[(index - 1) % widths.length],
    "--assistant-line-offset": offsets[(index - 1) % offsets.length],
    "--assistant-line-delay": `${index * 0.16}s`,
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

.assistant-workbench {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
}

.assistant-workbench--back {
  bottom: 8px;
  height: 48px;
  z-index: 1;
}

.assistant-workbench--front {
  bottom: 4px;
  height: 52px;
  z-index: 4;
}

.assistant-workbench__desk-shadow {
  position: absolute;
  left: 18px;
  right: 12px;
  bottom: 2px;
  height: 14px;
  border-radius: 999px;
  background: radial-gradient(circle, rgb(15 23 42 / 0.2), transparent 74%);
  filter: blur(5px);
}

.assistant-workbench__desk-top {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  height: 18px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(220 231 246 / 0.94));
  box-shadow:
    0 8px 18px rgb(15 23 42 / 0.12),
    inset 0 1px 0 rgb(255 255 255 / 0.92);
}

.assistant-workbench__desk-edge {
  position: absolute;
  left: 20px;
  right: 18px;
  bottom: 8px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(149 166 193 / 0.8), rgb(100 116 139 / 0.56));
}

.assistant-workbench__float-window {
  position: absolute;
  right: 8px;
  top: -3px;
  width: 36px;
  height: 23px;
  padding: 5px 4px 0;
  border: 1px solid rgb(255 255 255 / 0.58);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgb(25 34 52 / 0.96), rgb(10 16 27 / 0.94)),
    radial-gradient(circle at top left, rgb(59 130 246 / 0.32), transparent 48%);
  box-shadow:
    0 10px 18px rgb(15 23 42 / 0.18),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
  opacity: 0.88;
}

.assistant-workbench__float-line,
.assistant-workbench__code-line {
  display: block;
  height: 3px;
  margin-left: var(--assistant-line-offset);
  width: var(--assistant-line-width);
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(84 242 255 / 0.96), rgb(110 255 184 / 0.78));
}

.assistant-workbench__float-line + .assistant-workbench__float-line {
  margin-top: 3px;
}

.assistant-workbench__mug {
  position: absolute;
  left: 14px;
  bottom: 16px;
  width: 14px;
  height: 16px;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98), rgb(218 230 244 / 0.94));
  box-shadow: 0 7px 12px rgb(15 23 42 / 0.12);
}

.assistant-workbench__mug::after {
  content: "";
  position: absolute;
  right: -5px;
  top: 3px;
  width: 5px;
  height: 7px;
  border: 2px solid rgb(208 220 238 / 0.9);
  border-left: 0;
  border-radius: 0 999px 999px 0;
}

.assistant-workbench__steam {
  position: absolute;
  bottom: calc(100% - 1px);
  width: 6px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0), rgb(255 255 255 / 0.74), rgb(255 255 255 / 0));
  filter: blur(1px);
  animation: assistant-steam 2.2s ease-in-out infinite;
}

.assistant-workbench__steam--1 {
  left: 2px;
}

.assistant-workbench__steam--2 {
  left: 8px;
  animation-delay: 0.7s;
}

.assistant-workbench__laptop {
  position: absolute;
  left: 50%;
  bottom: 10px;
  width: 54px;
  height: 38px;
  transform: translateX(-50%);
}

.assistant-workbench__screen {
  position: absolute;
  inset: 0 3px 10px;
  padding-top: 6px;
  border: 1px solid rgb(132 151 183 / 0.76);
  border-radius: 10px 10px 5px 5px;
  background:
    linear-gradient(180deg, rgb(19 27 43 / 0.98), rgb(8 14 24 / 0.96)),
    radial-gradient(circle at top left, rgb(56 189 248 / 0.28), transparent 46%);
  box-shadow:
    0 10px 22px rgb(15 23 42 / 0.24),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
  overflow: hidden;
}

.assistant-workbench__screen-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, rgb(255 255 255 / 0.16), transparent 38%);
}

.assistant-workbench__code-line {
  position: relative;
  z-index: 1;
  margin-top: 4px;
  animation: assistant-code-scroll 2.2s ease-in-out infinite;
  animation-delay: var(--assistant-line-delay);
}

.assistant-workbench__camera {
  position: absolute;
  left: 50%;
  top: 2px;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgb(133 154 192 / 0.92);
  transform: translateX(-50%);
  z-index: 2;
}

.assistant-workbench__hinge {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 11px;
  height: 2px;
  border-radius: 999px;
  background: rgb(108 122 148 / 0.82);
}

.assistant-workbench__keyboard {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 13px;
  padding: 3px 6px 0;
  border-radius: 4px 4px 9px 9px;
  background: linear-gradient(180deg, rgb(240 245 252 / 0.98), rgb(193 206 226 / 0.96));
  box-shadow:
    0 6px 12px rgb(15 23 42 / 0.16),
    inset 0 1px 0 rgb(255 255 255 / 0.86);
}

.assistant-workbench__key-row {
  display: block;
  height: 2px;
  margin-bottom: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(112 134 170 / 0.88), rgb(166 186 214 / 0.72));
}

.assistant-workbench__pad {
  position: absolute;
  right: 12px;
  bottom: 11px;
  width: 18px;
  height: 13px;
  border-radius: 5px;
  background: linear-gradient(180deg, rgb(245 248 252 / 0.98), rgb(206 216 232 / 0.96));
  box-shadow: 0 6px 10px rgb(15 23 42 / 0.1);
}

.assistant-workbench__pad-dot {
  position: absolute;
  inset: 4px 6px;
  border-radius: 999px;
  background: rgb(133 146 170 / 0.6);
}

.assistant-prop {
  position: absolute;
  z-index: 4;
  pointer-events: none;
}

.assistant-prop--phone {
  right: 18px;
  bottom: 26px;
  transform: rotate(13deg);
}

.assistant-prop__phone {
  position: relative;
  width: 22px;
  height: 34px;
  padding: 7px 4px 0;
  border: 1px solid rgb(188 200 222 / 0.82);
  border-radius: 7px;
  background:
    linear-gradient(180deg, rgb(19 28 44 / 0.98), rgb(6 12 22 / 0.96)),
    radial-gradient(circle at top left, rgb(59 130 246 / 0.3), transparent 44%);
  box-shadow:
    0 10px 18px rgb(15 23 42 / 0.24),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.assistant-prop__phone-camera {
  position: absolute;
  left: 50%;
  top: 3px;
  width: 5px;
  height: 2px;
  border-radius: 999px;
  background: rgb(110 126 156 / 0.92);
  transform: translateX(-50%);
}

.assistant-prop__phone-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, rgb(255 255 255 / 0.14), transparent 38%);
}

.assistant-prop__phone-line {
  position: relative;
  z-index: 1;
  display: block;
  height: 2px;
  margin-top: 3px;
  margin-left: var(--assistant-line-offset);
  width: var(--assistant-line-width);
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(84 242 255 / 0.96), rgb(150 240 255 / 0.74));
}

.assistant-prop--smoke {
  left: 26px;
  bottom: 32px;
  width: 28px;
  height: 40px;
}

.assistant-prop__cigarette {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 18px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(255 250 240 / 0.98), rgb(239 226 205 / 0.96) 68%, rgb(245 158 11 / 0.98) 68%, rgb(180 83 9 / 0.98));
  box-shadow: 0 5px 10px rgb(15 23 42 / 0.12);
  transform: rotate(-18deg);
}

.assistant-prop__ember {
  position: absolute;
  left: -2px;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgb(251 146 60);
  box-shadow: 0 0 12px rgb(249 115 22 / 0.56);
  transform: translateY(-50%);
}

.assistant-prop__smoke {
  position: absolute;
  left: 6px;
  bottom: 8px;
  width: 10px;
  height: 22px;
  border-radius: 999px;
  border: 1.6px solid rgb(255 255 255 / 0.32);
  border-color: rgb(255 255 255 / 0.32) transparent transparent transparent;
  filter: blur(.2px);
  opacity: .74;
  animation: assistant-smoke 2.6s ease-in-out infinite;
}

.assistant-prop__smoke--2 {
  left: 10px;
  bottom: 13px;
  animation-delay: .8s;
}

.assistant-prop__smoke--3 {
  left: 14px;
  bottom: 18px;
  animation-delay: 1.4s;
}

.assistant-pet-svg {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 18px 22px rgb(23 35 57 / 0.2));
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
  stroke: color-mix(in srgb, var(--assistant-fur-tertiary) 58%, rgb(255 255 255 / 0.2));
  stroke-width: 2.4;
}

.assistant-pet-svg__fur--chest,
.assistant-pet-svg__fur--dog-belly {
  fill: var(--assistant-fur-secondary);
  stroke: rgb(255 255 255 / 0.36);
  stroke-width: 1.8;
}

.assistant-pet-svg__patch {
  fill: color-mix(in srgb, var(--assistant-fur-tertiary) 82%, black);
}

.assistant-pet-svg__muzzle {
  fill: var(--assistant-fur-secondary);
  stroke: rgb(255 255 255 / 0.3);
  stroke-width: 1.8;
}

.assistant-pet-svg__muzzle--dog {
  fill: color-mix(in srgb, var(--assistant-fur-secondary) 92%, white);
}

.assistant-pet-svg__ear {
  fill: var(--assistant-fur-primary);
  stroke: color-mix(in srgb, var(--assistant-fur-tertiary) 56%, transparent);
  stroke-width: 1.6;
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
  stroke: rgb(255 255 255 / 0.28);
  stroke-width: 1.6;
}

.assistant-pet-svg__paw--left {
  transform-origin: 84px 196px;
  transform: translateY(calc(var(--assistant-paw-lift) * -1));
}

.assistant-pet-svg__paw--right {
  transform-origin: 136px 196px;
  transform: translateY(calc(var(--assistant-right-paw-lift) * -1));
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

.assistant-pet-svg__shine {
  fill: rgb(255 255 255 / 0.16);
  mix-blend-mode: screen;
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

.assistant-live2d--work-coding .assistant-pet-svg__head {
  animation: assistant-focus-bob 0.9s ease-in-out infinite;
}

.assistant-live2d--work-review .assistant-pet-svg__head {
  animation: assistant-review-glance 2.6s ease-in-out infinite;
}

.assistant-live2d--work-coding .assistant-workbench__screen,
.assistant-live2d--work-review .assistant-workbench__screen {
  box-shadow:
    0 12px 24px rgb(15 23 42 / 0.26),
    0 0 14px rgb(56 189 248 / 0.16),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.assistant-live2d--work-coding .assistant-workbench__code-line {
  animation-duration: 1.2s;
}

.assistant-live2d--work-review .assistant-workbench__float-window {
  animation: assistant-review-panel 2.6s ease-in-out infinite;
}

.assistant-live2d--work-coding .assistant-workbench__keyboard {
  animation: assistant-keyboard-bounce 0.58s ease-in-out infinite alternate;
}

.assistant-live2d--work-sleep .assistant-workbench__code-line,
.assistant-live2d--work-sleep .assistant-workbench__float-line {
  opacity: 0.18;
}

.assistant-live2d--scene-phone .assistant-prop__phone {
  animation: assistant-phone-check 1.2s ease-in-out infinite alternate;
}

.assistant-live2d--scene-smoke .assistant-prop__cigarette {
  animation: assistant-cigarette-drift 1.8s ease-in-out infinite;
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

@keyframes assistant-code-scroll {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.44;
  }

  50% {
    transform: translateX(3px);
    opacity: 0.96;
  }
}

@keyframes assistant-steam {
  0% {
    transform: translateY(4px) scaleX(0.9);
    opacity: 0;
  }

  40% {
    opacity: 0.74;
  }

  100% {
    transform: translateY(-8px) scaleX(1.08);
    opacity: 0;
  }
}

@keyframes assistant-focus-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-1deg);
  }

  50% {
    transform: translateY(1px) rotate(2deg);
  }
}

@keyframes assistant-review-glance {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }

  30% {
    transform: translateX(-1px) rotate(-1.5deg);
  }

  62% {
    transform: translateX(1px) rotate(1.2deg);
  }
}

@keyframes assistant-review-panel {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.86;
  }

  50% {
    transform: translateY(-1px);
    opacity: 1;
  }
}

@keyframes assistant-keyboard-bounce {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-1px);
  }
}

@keyframes assistant-phone-check {
  0% {
    transform: rotate(-5deg) translateY(0);
  }

  100% {
    transform: rotate(6deg) translateY(-2px);
  }
}

@keyframes assistant-cigarette-drift {
  0%,
  100% {
    transform: rotate(-18deg) translateX(0);
  }

  50% {
    transform: rotate(-10deg) translateX(2px);
  }
}

@keyframes assistant-smoke {
  0% {
    transform: translateY(4px) scale(.86) rotate(-4deg);
    opacity: 0;
  }

  35% {
    opacity: .56;
  }

  100% {
    transform: translateY(-12px) scale(1.08) rotate(8deg);
    opacity: 0;
  }
}
</style>
