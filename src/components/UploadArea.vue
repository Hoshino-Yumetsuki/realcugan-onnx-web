<script setup lang="ts">
import { useWorkspace } from "../workspace-context"

const w = useWorkspace()
</script>

<template>
  <div
    v-if="w.uploadPreviewWidth === 0 && !w.isProcessDone"
    style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center"
  >
    <div class="focus-lines" aria-hidden="true"></div>
    <el-upload
      :ref="(el) => w.setElementRef('imageUpload', el)"
      class="large-upload"
      drag
      multiple
      :auto-upload="false"
      :disabled="w.wasmLoading"
      accept="image/png,image/jpeg,image/webp,image/bmp"
      :on-change="w.onUploadChange"
    >
      <div v-if="w.wasmLoading" class="upload-loading-state" aria-live="polite">
        <div class="upload-loading-orb" aria-hidden="true"><span></span><span></span></div>
        <div class="upload-loading-title">{{ w.t("stage.loadingAssets") }}</div>
        <div class="upload-loading-progress">{{ w.getWasmLoadingText() }}</div>
        <div
          class="upload-loading-bar"
          :class="{ 'is-indeterminate': !w.hasStableWasmProgress() }"
          aria-hidden="true"
        >
          <span :style="{ width: w.wasmLoadingProgress + '%' }"></span>
        </div>
      </div>
      <div v-if="!w.wasmLoading" class="run mb4" style="pointer-events: none" aria-hidden="true">
        <svg class="ring" viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-dasharray="2 6"
          ></circle>
        </svg>
        <svg class="ring2" viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-dasharray="14 10"
          ></circle>
        </svg>
        <span class="core"
          ><svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M13 2 4 14h7l-1 8 9-12h-7z"></path></svg
        ></span>
      </div>
      <div v-if="!w.wasmLoading" class="el-upload__text">
        {{ w.t("upload.drag") }}<em>{{ w.t("upload.click") }}</em>
        <span class="upload-format-hint">{{ w.t("upload.batchHint") }}</span>
      </div>
    </el-upload>
  </div>
</template>
