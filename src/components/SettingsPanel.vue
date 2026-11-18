<script setup lang="ts">
import { useWorkspace } from "../workspace-context"
import BatchQueue from "./BatchQueue.vue"

const w = useWorkspace()
</script>

<template>
  <aside
    :ref="(el) => w.setElementRef('controlPanel', el)"
    class="control-panel card card-ctl ctl"
    data-reveal="up"
    :class="{ 'mobile-drawer-open': w.isMobile && w.mobileSettingsVisible }"
    :role="w.isMobile && w.mobileSettingsVisible ? 'dialog' : undefined"
    :aria-modal="w.isMobile && w.mobileSettingsVisible ? 'true' : undefined"
  >
    <div class="card-head">
      <div class="lay lay-ic g2">
        <svg
          class="c-sig"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3l1.9 4.8L18.7 9.7 13.9 11.6 12 16.4 10.1 11.6 5.3 9.7 10.1 7.8z"></path>
          <path d="M19 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"></path>
        </svg>
        <span class="ml c-sig">{{ w.t("controls.params") }}</span>
        <el-popover
          v-model:visible="w.projectInfoVisible"
          :placement="w.infoPopoverPlacement"
          :trigger="[]"
          popper-class="info-popover"
          :width="300"
        >
          <div class="info-popover-content">
            <p>
              {{ w.t("help.localPrefix") }}<b>{{ w.t("help.localStrong") }}</b
              >{{ w.t("help.localSuffix") }}
            </p>
            <p><b>{{ w.t("help.noticeTitle") }}</b>{{ w.t("help.noticeText") }}</p>
            <p><b>{{ w.t("help.scaleTitle") }}</b>{{ w.t("help.scaleText") }}</p>
            <p><b>{{ w.t("help.denoiseTitle") }}</b>{{ w.t("help.denoiseText") }}</p>
          </div>
          <template #reference
            ><button
              type="button"
              class="info-button"
              :aria-label="w.t('help.projectInfoLabel')"
              @mouseenter="w.showInfoPopover"
              @mouseleave="w.hideInfoPopover"
              @touchstart.stop.prevent="w.toggleInfoPopover"
              @click.stop="w.toggleInfoPopover"
            >
              i
            </button></template
          >
        </el-popover>
      </div>
      <div class="lay lay-ic g2">
        <span class="ml-sm c-mute">/ 01</span>
        <button
          v-if="w.isMobile"
          :ref="(el) => w.setElementRef('drawerCloseButton', el)"
          type="button"
          class="mobile-drawer-close"
          @click="w.closeMobileSettings"
          :aria-label="w.t('actions.close')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="card-div"></div>
    <div class="card-body">
      <div class="field">
        <div class="field-l">{{ w.t("controls.model") }}</div>
        <el-radio-group
          :model-value="w.modelTypeRadio"
          @change="w.onModelTypeOptionChange"
          size="small"
          class="w100"
          style="display: flex"
        >
          <el-radio-button value="se" style="flex: 1">{{ w.t("model.se") }}</el-radio-button>
          <el-radio-button value="pro" style="flex: 1">{{ w.t("model.pro") }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="field">
        <div class="field-l">{{ w.t("controls.scale") }}</div>
        <div class="scale-row">
          <div
            v-for="scale in [2, 3, 4]"
            :key="scale"
            class="scale-cell"
            :style="{
              flex: w.isDesignScaleHidden(scale) ? '0 0 0px' : '1 1 0%',
              opacity: w.isDesignScaleHidden(scale) ? 0 : 1,
              transform: w.isDesignScaleHidden(scale) ? 'scale(0.7)' : 'scale(1)',
              pointerEvents: w.isDesignScaleHidden(scale) ? 'none' : 'auto'
            }"
          >
            <button
              type="button"
              class="scale-num"
              :class="{ 'is-on': w.scaleRadio === scale }"
              :tabindex="w.isDesignScaleHidden(scale) ? -1 : 0"
              @click="w.setDesignScale(scale)"
            >
              {{ scale }}<sup>×</sup>
            </button>
          </div>
          <div class="scale-bar-track" aria-hidden="true">
            <div
              class="scale-bar"
              :style="{
                left: w.getDesignScaleBarLeft() + '%',
                width: 100 / w.getVisibleDesignScales().length + '%'
              }"
            ></div>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="field-l">{{ w.t("controls.denoise") }}</div>
        <div
          class="denoise-row"
          :class="{ 'is-scrub': w.designDenoiseScrubbing }"
          @pointerdown="w.startDesignDenoiseScrub"
          @pointermove="w.moveDesignDenoiseScrub"
          @pointerup="w.endDesignDenoiseScrub"
          @pointercancel="w.endDesignDenoiseScrub"
        >
          <div
            v-for="option in w.getDesignDenoiseOptions()"
            :key="option.value"
            class="denoise-cell"
            :style="{
              maxWidth: w.isDenoiseDisabled(option.value) ? '0px' : '120px',
              opacity: w.isDenoiseDisabled(option.value) ? 0 : 1,
              transform: w.isDenoiseDisabled(option.value)
                ? 'scale(0.7) translateY(8px)'
                : 'scale(1) translateY(0)',
              pointerEvents: w.isDenoiseDisabled(option.value) ? 'none' : 'auto'
            }"
          >
            <button
              type="button"
              class="tick"
              :class="{ 'is-on': w.denoiseRadio === option.value }"
              :tabindex="w.isDenoiseDisabled(option.value) ? -1 : 0"
              @click="w.setDesignDenoise(option.value)"
            >
              <span class="bar"></span><span style="font-size: 10.5px">{{ option.label }}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="field-l">{{ w.t("controls.backendMode") }}</div>
        <el-radio-group
          :model-value="w.backendMode"
          :disabled="w.isProcessing || w.isBatchProcessing"
          @change="w.onBackendOptionChange"
          size="small"
          class="w100"
          style="display: flex"
        >
          <el-radio-button value="webgpu" style="flex: 1">{{
            w.t("backend.webgpu")
          }}</el-radio-button>
          <el-radio-button value="wasm" style="flex: 1">{{ w.t("backend.wasm") }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="ctl-foot">
        <div class="lay g2 w100 action-section">
          <el-button
            v-if="!w.isProcessing && w.uploadPreviewWidth === 0"
            size="small"
            round
            class="eb"
            style="flex: 1"
            :loading="w.wasmLoading"
            @click="w.runTestCase(); w.closeMobileSettings()"
            ><svg
              class="ic"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="13" height="13" rx="2"></rect>
              <path d="M21 8v11a2 2 0 0 1-2 2H8"></path>
              <circle cx="8" cy="8" r="1.4"></circle>
              <path d="M3 13l3-3 4 4"></path></svg
            ><span>{{ w.t("actions.sample") }}</span></el-button
          >
          <el-button
            v-if="!w.isProcessing && w.uploadPreviewWidth !== 0"
            size="small"
            round
            class="eb"
            style="flex: 1"
            @click="w.resetWorkspace(); w.closeMobileSettings()"
            ><svg
              class="ic"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 2.6-6.4"></path>
              <path d="M3 3v5h5"></path></svg
            ><span>{{
              w.isBatchActive ? w.t("actions.clearBatch") : w.t("actions.reset")
            }}</span></el-button
          >
          <el-button
            v-if="w.isProcessDone && !w.isBatchActive"
            size="small"
            round
            class="eb-accent save-cta"
            style="flex: 1"
            @click="w.saveOutput(); w.closeMobileSettings()"
            ><svg
              class="ic"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <path d="M7 10l5 5 5-5"></path>
              <path d="M12 15V3"></path></svg
            ><span>{{ w.t("actions.save") }}</span></el-button
          >
          <el-button
            v-if="w.isBatchActive && w.batchDownloadCount > 0"
            size="small"
            round
            class="eb-accent"
            style="flex: 1"
            @click="w.downloadAllBatchResults(); w.closeMobileSettings()"
            ><svg
              class="ic"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <path d="M7 10l5 5 5-5"></path>
              <path d="M12 15V3"></path></svg
            ><span>{{ w.t("actions.downloadAll") }}</span></el-button
          >
          <el-button
            v-if="w.isProcessing && !w.isProcessDone"
            size="small"
            round
            class="eb"
            style="flex: 1"
            :loading="w.isCancelling"
            :disabled="w.isCancelling"
            @click="w.stopProcess(); w.closeMobileSettings()"
            ><svg
              class="ic"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12"></path></svg
            ><span>{{
              w.isCancelling ? w.t("actions.cancelling") : w.t("actions.cancel")
            }}</span></el-button
          >
        </div>
      </div>
      <BatchQueue />
    </div>
  </aside>
</template>
