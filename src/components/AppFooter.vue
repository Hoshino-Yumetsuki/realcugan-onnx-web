<script setup lang="ts">
import { useWorkspace } from "../workspace-context"

const w = useWorkspace()
</script>

<template>
  <el-footer class="app-footer">
    <span>{{ w.t("footer.version") }}: {{ w.appVersion }}</span>
    <span>{{ w.t("footer.backend") }}: {{ w.t(`backend.${w.backendMode}`) }}</span>
    <a href="https://github.com/Hoshino-Yumetsuki/realcugan-onnx-web" target="_blank">GitHub</a>
    <a href="https://github.com/hanFengSan/realcugan-ncnn-webassembly" target="_blank">{{
      w.t("nav.originalProject")
    }}</a>
    <a href="https://github.com/bilibili/ailab/tree/main/Real-CUGAN" target="_blank">Real-CUGAN</a>
    <a href="https://onnxruntime.ai/" target="_blank">ONNX Runtime</a>
  </el-footer>
</template>
