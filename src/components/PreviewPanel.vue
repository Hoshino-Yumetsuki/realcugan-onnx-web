<script setup lang="ts">
import { useWorkspace } from "../workspace-context"
import UploadArea from "./UploadArea.vue"
import ImageComparison from "./ImageComparison.vue"

const w = useWorkspace()
</script>

<template>
  <section
    :ref="(el) => w.setElementRef('stagePanel', el)"
    class="stage-panel card stage-panel-adaptive"
    data-reveal="up"
    style="--d: 120ms"
    :class="{ 'is-charging': w.isProcessing && w.progressRate > 0 }"
    :style="[w.getStagePanelStyle(), { '--charge': w.progressRate + '%' }]"
  >
    <div :ref="(el) => w.setElementRef('stageToolbar', el)" class="stage-toolbar stage-head">
      <div class="lay lay-ic g3 wrap">
        <svg
          class="slowspin c-sig"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m14.3 8 5.7 9.9"></path>
          <path d="M9.7 8h11.5"></path>
          <path d="m7.4 12 5.7-9.9"></path>
          <path d="M9.7 16 4 6.1"></path>
          <path d="M14.3 16H2.8"></path>
          <path d="m16.6 12-5.7 9.9"></path>
        </svg>
        <div>
          <div v-if="w.isMobile && !w.uploadPreviewName" class="stage-eyebrow">Real-CUGAN Web</div>
          <div class="stage-title">
            <template v-if="w.uploadPreviewName">{{ w.uploadPreviewName }}</template>
            <template v-else-if="w.isMobile">{{ w.t("app.heading") }}</template>
            <template v-else>{{ w.t("stage.workspace") }}</template>
          </div>
          <div v-if="w.uploadPreviewWidth !== 0" class="stage-meta">
            {{ w.uploadPreviewWidth }} × {{ w.uploadPreviewHeight }} -&gt;
            {{ w.outputPreviewWidth || w.uploadPreviewWidth * w.scaleRadio }} ×
            {{ w.outputPreviewHeight || w.uploadPreviewHeight * w.scaleRadio }}
          </div>
          <div v-else class="stage-meta">
            <span v-if="w.wasmLoading">{{ w.getWasmLoadingText() }}</span>
            <span v-else>{{ w.getCurrentParamsText }}</span>
          </div>
          <div
            v-if="w.isProcessing || w.isProcessDone"
            class="stage-status"
            role="status"
            aria-live="polite"
          >
            {{ w.progressTip }}
          </div>
        </div>
        <span
          class="pill"
          style="width: 6px; height: 6px"
          :style="{
            background: w.isProcessing
              ? 'var(--c-primary)'
              : w.isProcessDone
                ? 'var(--c-secondary)'
                : 'var(--mute)',
            boxShadow: w.isProcessing ? '0 0 8px var(--c-primary)' : 'none'
          }"
        ></span>
      </div>
      <div v-if="w.isProcessDone" class="preview-tools">
        <el-button
          size="small"
          :disabled="w.previewZoom <= w.previewZoomMin"
          @click="w.zoomOutPreview"
          >{{ w.t("preview.zoomOut") }}</el-button
        >
        <button type="button" class="zoom-readout" title="100%" @click="w.resetPreviewZoom">
          {{ Math.round(w.previewZoom) }}%
        </button>
        <el-button
          size="small"
          :disabled="w.previewZoom >= w.previewZoomMax"
          @click="w.zoomInPreview"
          >{{ w.t("preview.zoomIn") }}</el-button
        >
      </div>
    </div>
    <div class="stage-line"></div>
    <div
      :ref="(el) => w.setElementRef('stageSurface', el)"
      class="stage-body stage-vp"
      :class="[
        w.getStageSurfaceClass(w.getCurrentStageKind()),
        {
          'processing-stage': w.uploadPreviewWidth !== 0 && !w.isProcessDone,
          'result-stage': w.isProcessDone,
          'result-overlap': w.isProcessDone,
          'is-revealing': w.isResultRevealing
        }
      ]"
      :style="w.getStageSurfaceStyle(w.getCurrentStageKind())"
    >
      <span
        class="hud"
        style="top: 10px; left: 10px; border-top: 2px solid; border-left: 2px solid"
      ></span>
      <span
        class="hud"
        style="top: 10px; right: 10px; border-top: 2px solid; border-right: 2px solid"
      ></span>
      <span
        class="hud"
        style="bottom: 10px; left: 10px; border-bottom: 2px solid; border-left: 2px solid"
      ></span>
      <span
        class="hud"
        style="bottom: 10px; right: 10px; border-bottom: 2px solid; border-right: 2px solid"
      ></span>
      <div
        v-if="w.isProcessing || w.isResultRevealing"
        class="mesh liquid is-on"
        :class="{ 'is-reveal': w.isResultRevealing }"
        aria-hidden="true"
      >
        <span></span><span></span><span></span><span></span>
      </div>
      <div
        v-if="w.isProcessing || w.isResultRevealing"
        class="dot-grid"
        :class="{ 'dots-fade': w.isResultRevealing }"
        aria-hidden="true"
      >
        <span
          v-for="(dot, index) in w.designDots"
          :key="index"
          class="dot-pop"
          :style="{
            left: dot.nx * 100 + '%',
            top: dot.ny * 100 + '%',
            background: dot.color,
            '--delay': dot.delay + 's',
            boxShadow: '0 0 5px ' + dot.color
          }"
        ></span>
      </div>
      <UploadArea />
      <template v-if="w.uploadPreviewWidth !== 0 && !w.isProcessDone">
        <el-image
          v-if="w.uploadImgSrc"
          class="processing-preview"
          :class="{ lowres: w.isProcessing }"
          :preview-src-list="[w.uploadImgSrc]"
          :src="w.uploadImgSrc"
          :style="{
            width: w.getInputPreviewSize().width + 'px',
            height: w.getInputPreviewSize().height + 'px'
          }"
        ></el-image>
        <div v-if="!w.isProcessing" class="ready-vignette"></div>
        <div v-if="!w.isProcessing" class="wipe-stack">
          <div
            v-for="(txt, index) in w.getReadyWipeLines()"
            :key="txt"
            class="wipe-line"
            :style="'--d1:' + (0.12 + index * 0.46) + 's;--d2:' + (0.4 + index * 0.46) + 's'"
          >
            <span class="wipe-mark"></span><span class="wipe-bg"></span
            ><span class="wipe-base">{{ txt }}</span><span class="wipe-on">{{ txt }}</span>
          </div>
        </div>
        <div v-if="!w.isProcessing" class="fill lay lay-c ready-action-layer">
          <div class="ready-isle">
            <div class="ready-badge">✓ {{ w.t("stage.ready") }}</div>
            <button type="button" class="btn-run" @click="w.startReadyProcess">
              ✦ {{ w.t("stage.start") }}
            </button>
          </div>
        </div>
        <div v-if="w.isProcessing" class="abs-c tc processing-hud">
          <div class="processing-number">{{ w.progressRate }}<span>%</span></div>
          <div class="processing-status" aria-hidden="true">{{ w.progressTip }}</div>
          <el-button
            class="processing-cancel"
            size="small"
            round
            :loading="w.isCancelling"
            :disabled="w.isCancelling"
            @click.stop="w.stopProcess"
            >{{ w.isCancelling ? w.t("actions.cancelling") : w.t("actions.cancel") }}</el-button
          >
        </div>
      </template>
      <ImageComparison />
    </div>
    <div style="display: none"><canvas id="canvas-upload"></canvas><a id="download-link"></a></div>
  </section>
</template>
