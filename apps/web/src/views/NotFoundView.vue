<template>
  <section class="not-found-page">
    <div class="container">
      <div class="not-found-card">
        <div class="not-found-visual" aria-hidden="true">
          <div class="not-found-grid" />
          <div class="not-found-layer not-found-layer--back" />
          <div class="not-found-layer not-found-layer--middle" />
          <div class="not-found-panel">
            <span class="not-found-panel__code">404</span>
            <div class="not-found-panel__lines">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div class="not-found-trace">
            <span class="not-found-trace__dot not-found-trace__dot--start" />
            <span class="not-found-trace__line" />
            <span class="not-found-trace__dot not-found-trace__dot--end" />
          </div>
        </div>

        <div class="not-found-copy">
          <h1>&#39029;&#38754;&#19981;&#23384;&#22312;</h1>
          <p>&#20320;&#35775;&#38382;&#30340;&#22320;&#22336;&#27809;&#26377;&#23545;&#24212;&#20869;&#23481;&#65292;&#21487;&#33021;&#24050;&#34987;&#31227;&#21160;&#25110;&#21024;&#38500;&#12290;&#21487;&#20197;&#20174;&#19979;&#38754;&#30340;&#20837;&#21475;&#32487;&#32493;&#27983;&#35272;&#12290;</p>
        </div>

        <div class="not-found-links">
          <RouterLink to="/posts" class="not-found-link-card">
            <strong>&#25991;&#31456;&#21015;&#34920;</strong>
            <span>&#30452;&#25509;&#22238;&#21040;&#20840;&#37096;&#25991;&#31456;</span>
          </RouterLink>
          <RouterLink to="/categories" class="not-found-link-card">
            <strong>&#20998;&#31867;</strong>
            <span>&#25353;&#20027;&#39064;&#32487;&#32493;&#27983;&#35272;</span>
          </RouterLink>
          <RouterLink to="/tags" class="not-found-link-card">
            <strong>&#26631;&#31614;</strong>
            <span>&#20174;&#28909;&#38376;&#20027;&#39064;&#36827;&#20837;</span>
          </RouterLink>
        </div>

        <div class="not-found-actions">
          <RouterLink to="/" class="not-found-primary">&#36820;&#22238;&#39318;&#39029;</RouterLink>
          <button type="button" class="not-found-secondary" @click="goBack">&#36820;&#22238;&#19978;&#19968;&#39029;</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
function goBack() {
  window.history.length > 1 ? window.history.back() : window.location.assign('/');
}
</script>

<style scoped>
.not-found-page {
  padding: 64px 0 96px;
}

.not-found-card {
  display: grid;
  gap: 18px;
  max-width: 760px;
  margin: 0 auto;
  padding: 34px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.08);
}

.not-found-visual {
  position: relative;
  min-height: 250px;
  overflow: hidden;
  border-radius: 26px;
  background:
    radial-gradient(circle at center, rgba(59, 130, 246, 0.1), transparent 42%),
    linear-gradient(180deg, rgba(239, 246, 255, 0.92), rgba(248, 250, 252, 0.9));
}

.not-found-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
}

.not-found-layer,
.not-found-panel {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  border-radius: 28px;
}

.not-found-layer {
  width: 240px;
  height: 150px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.62);
}

.not-found-layer--back {
  transform: translate(-50%, -50%) rotate(-10deg);
}

.not-found-layer--middle {
  transform: translate(-50%, -50%) rotate(8deg);
}

.not-found-panel {
  z-index: 1;
  display: grid;
  gap: 18px;
  width: 260px;
  padding: 28px 26px;
  background: linear-gradient(135deg, #0f172a, #1d4ed8);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.22);
}

.not-found-panel__code {
  color: #fff;
  font-size: 40px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.not-found-panel__lines {
  display: grid;
  gap: 10px;
}

.not-found-panel__lines span {
  display: block;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

.not-found-panel__lines span:nth-child(1) {
  width: 68%;
}

.not-found-panel__lines span:nth-child(2) {
  width: 86%;
}

.not-found-panel__lines span:nth-child(3) {
  width: 54%;
}

.not-found-trace {
  position: absolute;
  right: 56px;
  bottom: 38px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.not-found-trace__line {
  width: 92px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.18), rgba(14, 165, 233, 0.55));
}

.not-found-trace__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.16);
}

.not-found-trace__dot--end {
  background: #0284c7;
}

.not-found-copy {
  display: grid;
  gap: 10px;
}

.not-found-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.not-found-link-card {
  display: grid;
  gap: 6px;
  min-height: 88px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  color: #0f172a;
  text-decoration: none;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.not-found-link-card strong {
  font-size: 15px;
}

.not-found-link-card span {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.not-found-link-card:hover {
  transform: translateY(-1px);
  border-color: rgba(14, 165, 233, 0.24);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.08);
}

.not-found-card h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.08;
}

.not-found-card p {
  margin: 0;
  max-width: 48ch;
  color: #475569;
  line-height: 1.8;
}

.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.not-found-primary,
.not-found-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.not-found-primary {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #fff;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
}

.not-found-secondary {
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  cursor: pointer;
}

.not-found-primary:hover,
.not-found-secondary:hover {
  transform: translateY(-1px);
}

@media (max-width: 680px) {
  .not-found-page {
    padding: 40px 0 64px;
  }

  .not-found-card {
    padding: 24px 20px;
    border-radius: 24px;
  }

  .not-found-visual {
    min-height: 200px;
  }

  .not-found-layer {
    width: 180px;
    height: 116px;
  }

  .not-found-panel {
    width: 200px;
    padding: 22px 20px;
  }

  .not-found-panel__code {
    font-size: 32px;
  }

  .not-found-trace {
    right: 20px;
    bottom: 20px;
  }

  .not-found-trace__line {
    width: 56px;
  }

  .not-found-actions {
    display: grid;
  }

  .not-found-links {
    grid-template-columns: 1fr;
  }
}
</style>
