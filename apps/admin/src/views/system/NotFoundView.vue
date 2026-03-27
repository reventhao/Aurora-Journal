<template>
  <a-card :bordered="false" class="not-found-card">
    <div class="not-found-state">
      <div class="not-found-state__art" aria-hidden="true">
        <div class="not-found-state__layer not-found-state__layer--back" />
        <div class="not-found-state__layer not-found-state__layer--front" />
        <div class="not-found-state__panel">
          <strong>404</strong>
          <span />
          <span />
        </div>
      </div>

      <span class="not-found-state__badge">404</span>
      <h2>&#39029;&#38754;&#19981;&#23384;&#22312;</h2>
      <p>&#36825;&#20010;&#21518;&#21488;&#22320;&#22336;&#27809;&#26377;&#23545;&#24212;&#39029;&#38754;&#12290;&#20320;&#21487;&#20197;&#22238;&#21040;&#20202;&#34920;&#30424;&#65292;&#25110;&#32773;&#36820;&#22238;&#19978;&#19968;&#39029;&#32487;&#32493;&#25805;&#20316;&#12290;</p>

      <a-space>
        <a-button type="primary" @click="goDashboard">&#36820;&#22238;&#20202;&#34920;&#30424;</a-button>
        <a-button @click="goBack">&#36820;&#22238;&#19978;&#19968;&#39029;</a-button>
      </a-space>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goDashboard() {
  void router.push('/dashboard');
}

function goBack() {
  void router.back();
}
</script>

<style scoped>
.not-found-card {
  min-height: 360px;
}

.not-found-state {
  display: grid;
  gap: 16px;
  max-width: 560px;
  padding: 24px 4px;
}

.not-found-state__art {
  position: relative;
  min-height: 180px;
  overflow: hidden;
  border-radius: 24px;
  background:
    radial-gradient(circle at center, rgba(59, 130, 246, 0.12), transparent 42%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
}

.not-found-state__layer,
.not-found-state__panel {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  border-radius: 22px;
}

.not-found-state__layer {
  width: 168px;
  height: 112px;
  border: 1px solid rgba(59, 130, 246, 0.12);
  background: rgba(255, 255, 255, 0.68);
}

.not-found-state__layer--back {
  transform: translate(-50%, -50%) rotate(-8deg);
}

.not-found-state__layer--front {
  transform: translate(-50%, -50%) rotate(7deg);
}

.not-found-state__panel {
  z-index: 1;
  display: grid;
  gap: 10px;
  width: 184px;
  padding: 22px 20px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.22);
}

.not-found-state__panel strong {
  color: #fff;
  font-size: 30px;
  letter-spacing: 0.08em;
}

.not-found-state__panel span {
  display: block;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.not-found-state__panel span:nth-child(2) {
  width: 74%;
}

.not-found-state__panel span:nth-child(3) {
  width: 56%;
}

.not-found-state h2 {
  margin: 0;
  color: var(--admin-text);
  font-size: 28px;
}

.not-found-state p {
  margin: 0;
  color: var(--admin-text-secondary);
  line-height: 1.7;
}

.not-found-state__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 56px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-weight: 700;
}
</style>
