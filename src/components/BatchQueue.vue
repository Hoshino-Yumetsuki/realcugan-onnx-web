<script setup lang="ts">
import { useWorkspace } from "../workspace-context"

const w = useWorkspace()
</script>

<template>
  <div v-if="w.isBatchActive || w.batchItems.length > 0" class="field batch-section">
    <div class="field-l">{{ w.t("batch.title") }}</div>
    <div class="batch-summary">
      <span>{{
        w.t("batch.summary", { done: w.batchDoneCount, total: w.batchItems.length })
      }}</span>
      <span v-if="w.isBatchProcessing">{{ w.t("batch.running") }}</span>
    </div>
    <el-progress class="batch-progress" :percentage="w.batchProgressRate"></el-progress>
    <div
      v-if="w.batchItems.length > 0"
      class="batch-list"
      style="overflow-x: hidden; max-width: 100%; box-sizing: border-box"
    >
      <div
        v-for="item in w.batchItems"
        :key="item.id"
        role="button"
        tabindex="0"
        class="batch-item"
        :class="{
          'is-selected': w.selectedBatchItemId === item.id,
          'is-done': item.status === 'done'
        }"
        :style="w.getBatchItemStyle()"
        :aria-label="item.name + ' ' + w.t('batch.status.' + item.status)"
        @click="w.selectBatchItem(item)"
        @keydown.enter.prevent="w.selectBatchItem(item)"
        @keydown.space.prevent="w.selectBatchItem(item)"
      >
        <div v-if="item.previewObjectUrl" class="batch-item-thumb">
          <img :src="item.previewObjectUrl" alt="" />
          <span v-if="item.status === 'done'" class="batch-thumb-check" aria-hidden="true"
            ><svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12l4 4L19 6"></path></svg
          ></span>
        </div>
        <span class="batch-item-name">
          {{ item.name }}
          <span
            v-if="item.status === 'processing' && w.progressRate > 0"
            class="batch-item-progress"
            aria-hidden="true"
            ><span :style="{ width: w.progressRate + '%' }"></span
          ></span>
        </span>
        <span class="batch-item-action">
          <el-tag class="batch-status-tag" size="small" :type="w.getBatchTagType(item.status)">{{
            w.t("batch.status." + item.status)
          }}</el-tag>
          <button
            v-if="item.status === 'done'"
            type="button"
            class="batch-download-button"
            :style="w.getBatchDownloadButtonStyle(item)"
            :aria-label="w.t('actions.download') + ': ' + item.filename"
            :title="w.t('actions.download') + ': ' + item.filename"
            @click.stop="w.downloadBatchItem(item)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
            </svg>
          </button>
          <button
            v-if="
              (item.status === 'error' || item.status === 'cancelled') &&
              !w.isBatchProcessing &&
              !w.isProcessing
            "
            type="button"
            class="batch-download-button"
            :aria-label="w.t('actions.retry') + ': ' + item.name"
            :title="w.t('actions.retry') + ': ' + item.name"
            @click.stop="w.retryBatchItem(item)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 7v5h-5M20 12a8 8 0 1 0-2.3 5.7"></path>
            </svg>
          </button>
        </span>
      </div>
    </div>
  </div>
</template>
