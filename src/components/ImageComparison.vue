<script setup lang="ts">
import { useWorkspace } from "../workspace-context"

const w = useWorkspace()
</script>

<template>
  <template v-if="w.isProcessDone">
    <img
      v-if="w.outputImgSrc"
      class="stage-ambient-img"
      :src="w.outputImgSrc"
      alt=""
      aria-hidden="true"
    />
    <div
      :ref="(el) => w.setElementRef('previewViewport', el)"
      class="preview-pan-viewport result-in"
      :class="{
        'is-draggable': w.previewZoom > w.previewZoomMin,
        'is-dragging': w.previewDragging
      }"
      @mousedown="w.startPreviewPan"
      @dblclick.prevent="w.onPreviewDoubleClick"
      @touchstart="w.startPreviewPan"
      @touchmove="w.movePreviewPan"
      @touchend="w.endPreviewPan"
      @touchcancel="w.endPreviewPan"
      @wheel.stop.prevent="w.onPreviewWheel"
    >
      <div
        class="preview-pan-content"
        :style="{ transform: 'translate(' + w.previewPanX + 'px, ' + w.previewPanY + 'px)' }"
      >
        <div
          class="preview-overlap-container"
          :style="{
            width: w.zoomedPreviewSize.outputImgWidth + 'px',
            height: w.zoomedPreviewSize.outputImgHeight + 'px'
          }"
        >
          <img
            draggable="false"
            class="preview-overlap-origin"
            :src="w.uploadImgSrc"
            :alt="w.t('preview.before') + ' — ' + w.uploadPreviewName"
            :style="{
              width: w.zoomedPreviewSize.outputImgWidth + 'px',
              height: w.zoomedPreviewSize.outputImgHeight + 'px'
            }"
          />
          <div
            class="preview-overlap-output"
            :style="{
              width: w.getPreviewSplitLocalX() + 'px',
              height: w.zoomedPreviewSize.outputImgHeight + 'px'
            }"
          >
            <img
              draggable="false"
              class="preview-overlap-result"
              :src="w.outputImgSrc"
              :alt="w.t('preview.after') + ' — ' + w.uploadPreviewName"
              :style="{
                width: w.zoomedPreviewSize.outputImgWidth + 'px',
                height: w.zoomedPreviewSize.outputImgHeight + 'px'
              }"
            />
          </div>
        </div>
      </div>
      <div class="preview-split-indicator" :style="{ left: w.getPreviewSplitViewportX() + 'px' }">
        <div
          class="preview-split-handle"
          role="slider"
          tabindex="0"
          :aria-label="w.t('preview.before') + ' / ' + w.t('preview.after')"
          :aria-valuenow="Math.round(w.previewOverlapRate)"
          aria-valuemin="0"
          aria-valuemax="100"
          @mousedown.stop.prevent="w.startSplitDrag"
          @touchstart.stop.prevent="w.startSplitDrag"
          @keydown="w.onSplitHandleKeydown"
        >
          <svg
            width="10"
            height="12"
            viewBox="0 0 10 12"
            style="margin-right: -2px"
            aria-hidden="true"
          >
            <path d="M7 1 2 6l5 5z" fill="currentColor" />
          </svg>
          <svg
            width="10"
            height="12"
            viewBox="0 0 10 12"
            style="margin-left: -2px"
            aria-hidden="true"
          >
            <path d="m3 1 5 5-5 5z" fill="currentColor" />
          </svg>
        </div>
      </div>
      <span class="chip compare-chip compare-before">{{ w.t("preview.before") }}</span>
      <span class="chip compare-chip compare-after">{{ w.t("preview.after") }}</span>
    </div>
  </template>
</template>
