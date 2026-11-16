<script setup lang="ts">
import { useWorkspace } from "../workspace-context"

const w = useWorkspace()
</script>

<template>
  <div class="floating-preferences topnav">
    <el-dropdown trigger="click" @command="w.setLanguage">
      <el-button
        circle
        class="topnav-btn"
        :aria-label="w.t('nav.language') + ': ' + w.getLanguageLabel()"
        :title="w.t('nav.language') + ': ' + w.getLanguageLabel()"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <g
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M2 12h20"></path>
            <path
              d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            ></path>
          </g>
        </svg>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="zh" :class="{ 'is-current': w.language === 'zh' }"
            >中文</el-dropdown-item
          >
          <el-dropdown-item command="en" :class="{ 'is-current': w.language === 'en' }"
            >English</el-dropdown-item
          >
          <el-dropdown-item command="ja" :class="{ 'is-current': w.language === 'ja' }"
            >日本語</el-dropdown-item
          >
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-dropdown trigger="click" @command="w.setThemeMode">
      <el-button
        circle
        class="topnav-btn"
        :aria-label="w.t('nav.theme') + ': ' + w.getThemeModeLabel()"
        :title="w.t('nav.theme') + ': ' + w.getThemeModeLabel()"
      >
        <svg
          v-if="w.getEffectiveTheme() === 'dark'"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path>
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"
          ></path>
        </svg>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="auto" :class="{ 'is-current': w.themeMode === 'auto' }">{{
            w.t("theme.auto")
          }}</el-dropdown-item>
          <el-dropdown-item command="light" :class="{ 'is-current': w.themeMode === 'light' }">{{
            w.t("theme.light")
          }}</el-dropdown-item>
          <el-dropdown-item command="dark" :class="{ 'is-current': w.themeMode === 'dark' }">{{
            w.t("theme.dark")
          }}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>
