<script lang="ts">
import { defineComponent } from "vue"
import WorkspaceController from "./workspace"
import AppPreferences from "./components/AppPreferences.vue"
import SettingsPanel from "./components/SettingsPanel.vue"
import PreviewPanel from "./components/PreviewPanel.vue"
import AppFooter from "./components/AppFooter.vue"

export default defineComponent({
  name: "App",
  extends: WorkspaceController,
  components: { AppPreferences, SettingsPanel, PreviewPanel, AppFooter }
})
</script>

<template>
  <div class="rel design-root" style="min-height: 100vh; min-height: 100dvh">
    <div
      class="ambient-proc"
      :class="{ 'is-on': isProcessing || isResultRevealing }"
      aria-hidden="true"
    >
      <span></span><span></span><span></span>
    </div>
    <svg class="grain-svg" aria-hidden="true">
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          stitchTiles="stitch"
        ></feTurbulence>
        <feColorMatrix type="saturate" values="0"></feColorMatrix>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)"></rect>
    </svg>
    <span class="vc vc-tl"></span><span class="vc vc-tr"></span><span class="vc vc-bl"></span
    ><span class="vc vc-br"></span>
    <span data-parallax="2.4" class="float-word decor-upscale">UPSCALE</span>
    <span data-parallax="2.8" class="float-word decor-device">ON_DEVICE</span>
    <div class="fill design-sparkles" aria-hidden="true">
      <span class="sparkle" style="left: 8%; top: 22%; color: var(--c-primary)"
        ><span class="fl" style="--fd: 6s"
          ><span class="tw" style="--td: 3s"><span class="sparkle-glyph">✦</span></span></span
        ></span
      >
      <span class="sparkle" style="left: 90%; top: 30%; color: var(--c-tertiary)"
        ><span class="fl" style="--fd: 7s"
          ><span class="tw" style="--td: 2.4s"><span class="sparkle-glyph">✧</span></span></span
        ></span
      >
      <span class="sparkle" style="left: 78%; top: 70%; color: var(--c-secondary)"
        ><span class="fl" style="--fd: 8s"
          ><span class="tw" style="--td: 3.6s"><span class="sparkle-glyph">✦</span></span></span
        ></span
      >
      <span class="sparkle" style="left: 16%; top: 78%; color: var(--c-primary)"
        ><span class="fl" style="--fd: 6.5s"
          ><span class="tw" style="--td: 2.8s"><span class="sparkle-glyph">✧</span></span></span
        ></span
      >
      <span class="sparkle" style="left: 52%; top: 12%; color: var(--c-tertiary)"
        ><span class="fl" style="--fd: 5.5s"
          ><span class="tw" style="--td: 2.2s"><span class="sparkle-glyph">✦</span></span></span
        ></span
      >
      <span class="sparkle" style="left: 40%; top: 88%; color: var(--c-secondary)"
        ><span class="fl" style="--fd: 7.5s"
          ><span class="tw" style="--td: 3.2s"><span class="sparkle-glyph">✧</span></span></span
        ></span
      >
    </div>
    <el-container>
      <AppPreferences />
      <el-main
        :ref="(el) => setElementRef('appMain', el)"
        class="app-main shell app-main-adaptive"
        :class="{ 'mobile-settings-open': isMobile && mobileSettingsVisible }"
      >
        <header class="shell-head" data-reveal="up">
          <div
            class="brand-stroke"
            data-parallax="1.2"
            style="user-select: none"
            aria-label="Real-CUGAN Anime Image Upscaler"
          >
            <span>REAL—CUGAN</span>
            <span class="brand-solid">{{ t("app.brandSuffix") }}</span>
          </div>
        </header>
        <div
          :ref="(el) => setElementRef('workspace', el)"
          class="workspace console-grid workspace-adaptive"
          :style="getWorkspaceStyle()"
        >
          <SettingsPanel />
          <PreviewPanel />
        </div>
        <div
          v-if="isMobile && mobileSettingsVisible"
          class="mobile-drawer-backdrop"
          @click="closeMobileSettings"
          @touchmove.prevent
        ></div>
        <button
          v-if="isMobile && !mobileSettingsVisible"
          :ref="(el) => setElementRef('mobileSettingsFab', el)"
          type="button"
          class="mobile-settings-fab"
          :aria-label="t('controls.settingsButton')"
          @click="openMobileSettings"
        >
          <svg
            class="ic"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path
              d="m9 3-.6 2.3-2 .9-2.1-.6-2 3.4L4 10.7v2.6L2.3 15l2 3.4 2.1-.6 2 .9L9 21h4l.6-2.3 2-.9 2.1.6 2-3.4-1.7-1.7v-2.6L19.7 9l-2-3.4-2.1.6-2-.9L13 3z"
            ></path>
            <circle cx="11" cy="12" r="3"></circle>
          </svg>
          <span>{{ t("controls.settingsButton") }}</span>
        </button>
      </el-main>
      <AppFooter />
    </el-container>
  </div>
</template>
