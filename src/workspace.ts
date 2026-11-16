import { defineComponent, markRaw, type ComponentPublicInstance, type CSSProperties } from "vue"
import { ElMessageBox, ElNotification, type UploadInstance } from "element-plus"
import { colord, extend } from "colord"
import a11yPlugin from "colord/plugins/a11y"
import { I18N } from "./i18n"
import { WORKSPACE_KEY } from "./workspace-context"
import { ImageProcessor, type Backend } from "./processor"
import { MODELS } from "./models"
import { buildStoreZip } from "./zip"
import { version as appVersion } from "../package.json"

extend([a11yPlugin])

export type WorkspaceRefName =
  | "appMain"
  | "workspace"
  | "controlPanel"
  | "drawerCloseButton"
  | "stagePanel"
  | "stageToolbar"
  | "stageSurface"
  | "previewViewport"
  | "mobileSettingsFab"
  | "imageUpload"
type WorkspaceFile = { name: string; raw?: Blob }
type RGB = { r: number; g: number; b: number }
type ThemePalette = {
  primary: string
  soft: string
  border: string
  surfaceTint: string
  textStrong: string
  onPrimary: string
  readyBadge: string
  fluidColors: string[]
}
type DesignDot = { color: string; nx: number; ny: number; delay: number }
type ProcessResult = { filename: string; objectUrl: string; width: number; height: number }
type BatchItem = {
  id: string
  file: WorkspaceFile
  name: string
  status: "pending" | "processing" | "done" | "error" | "cancelled"
  previewObjectUrl: string
  outputPreviewObjectUrl: string
  inputWidth: number
  inputHeight: number
  outputWidth: number
  outputHeight: number
  outputScale: number
  outputDenoise: number
  outputModelType: string
  accentColor: string
  accentSoftColor: string
  accentTextColor: string
  filename: string
  objectUrl: string
}
interface WorkspaceState {
  language: string
  appVersion: string
  themeMode: string
  systemPrefersDark: boolean
  projectInfoVisible: boolean
  projectInfoPinned: boolean
  modelTypeRadio: string
  backendMode: Backend
  scaleRadio: number
  denoiseRadio: number
  designDenoiseScrubbing: boolean
  previewOverlapRate: number
  previewZoom: number
  previewZoomMin: number
  previewZoomMax: number
  previewZoomStep: number
  previewViewportWidth: number
  previewViewportHeight: number
  previewPanX: number
  previewPanY: number
  previewDragging: boolean
  splitDragging: boolean
  splitDragStartX: number
  splitDragStartRate: number
  previewDragStartX: number
  previewDragStartY: number
  previewDragOriginX: number
  previewDragOriginY: number
  previewPinchStartDistance: number
  previewPinchStartZoom: number
  uploadImgSrc: string
  uploadObjectUrl: string
  inputBlob: Blob | null
  isLoadingPreview: boolean
  uploadPreviewWidth: number
  uploadPreviewHeight: number
  uploadPreviewName: string
  isProcessing: boolean
  isCancelling: boolean
  isProcessDone: boolean
  isResultRevealing: boolean
  mobileSettingsVisible: boolean
  progressRate: number
  procFinalCostSeconds: number | string | null
  progressTip: string
  outputPreviewWidth: number
  outputPreviewHeight: number
  outputScale: number
  outputDenoise: number
  outputModelType: string
  windowWidth: number
  windowHeight: number
  stageLayoutTick: number
  outputImgSrc: string
  outputObjectUrl: string
  isBatchActive: boolean
  isBatchProcessing: boolean
  batchCancelRequested: boolean
  pendingUploadFile: WorkspaceFile | null
  pendingUploadFileList: WorkspaceFile[]
  batchItems: BatchItem[]
  activeBatchItemId: string | null
  selectedBatchItemId: string | null
  batchRunId: number
  extractedThemeColors: RGB[] | null
  designDots: readonly DesignDot[]
  wasmLoading: boolean
  wasmLoadingProgress: number
  activeImageId: number
  safeProcessingMode: boolean
  modelLoading: boolean
  modelLoadingProgress: number
  modelLoadingName: string
  modelLoadingFile: string
  processFailureDialogOpen: boolean
  elementRefs: Partial<Record<WorkspaceRefName, Element | ComponentPublicInstance | null>>
  uploadRef: UploadInstance | null
  imageProcessor: ImageProcessor
  panVelocitySamples: { x: number; y: number; t: number }[]
  panGlideFrame: number | null
  revealWipeFrame: number | null
  resultRevealTimer: ReturnType<typeof setTimeout> | null
  windowResizeHandler: (() => void) | null
  stageLayoutFrame: number | null
  processCompletionResolve: ((result: ProcessResult) => void) | null
  processCompletionReject: ((reason: unknown) => void) | null
  batchSelectionTimer: ReturnType<typeof setTimeout> | null
  modelLoadingTimer: ReturnType<typeof setTimeout> | null
  handleDrawerKeydown: ((event: KeyboardEvent) => void) | null
  handlePasteEvent: ((event: ClipboardEvent) => void) | null
  infoPopoverOutsideHandler: ((event: MouseEvent | TouchEvent) => void) | null
  removeDarkQueryListener: (() => void) | null
  webReRevealObserver: IntersectionObserver | null
  webReParallaxNodes: HTMLElement[] | null
  webReParallaxX: number
  webReParallaxY: number
  webReParallaxTargetX: number
  webReParallaxTargetY: number
  webReParallaxFrame: number | null
  webReParallaxPointerMove: ((event: PointerEvent) => void) | null
}
function isUploadInstance(
  value: ComponentPublicInstance
): value is ComponentPublicInstance & UploadInstance {
  return "clearFiles" in value && typeof value.clearFiles === "function"
}
const Logger = console
const ADAPTIVE_LAYOUT = {
  breakpoint: 1120,
  controlPanelWidth: 340,
  panelGap: 15,
  stagePadding: 24,
  appMainDesktopPaddingX: 44,
  appMainCompactPaddingX: 28,
  maxWorkspaceWidth: 1680,
  minPanelHeight: 420,
  minBodyWidth: 360,
  minBodyHeight: 260,
  minPreviewWidth: 280,
  minPreviewHeight: 220,
  emptyUploadWidth: 620,
  emptyUploadHeight: 330,
  fallbackToolbarHeight: 76,
  stagePanelChromeHeight: 93,
  minStageWidth: 320,
  narrowViewportGutter: 48,
  wideViewportGutter: 420,
  fallbackViewportHeightOffset: 300
}
const WorkspaceController = defineComponent({
  provide(): Record<symbol, unknown> {
    return { [WORKSPACE_KEY]: this }
  },
  data(): WorkspaceState {
    return {
      language: "zh",
      appVersion,
      themeMode: "auto",
      systemPrefersDark: false,
      projectInfoVisible: false,
      projectInfoPinned: false,
      modelTypeRadio: "se",
      backendMode: "webgpu",
      scaleRadio: 2,
      denoiseRadio: 3,
      designDenoiseScrubbing: false,
      previewOverlapRate: 50,
      previewZoom: 100,
      previewZoomMin: 100,
      previewZoomMax: 300,
      previewZoomStep: 25,
      previewViewportWidth: 0,
      previewViewportHeight: 0,
      previewPanX: 0,
      previewPanY: 0,
      previewDragging: false,
      splitDragging: false,
      previewDragStartX: 0,
      previewDragStartY: 0,
      previewDragOriginX: 0,
      previewDragOriginY: 0,
      previewPinchStartDistance: 0,
      previewPinchStartZoom: 100,
      uploadImgSrc: "",
      uploadObjectUrl: "",
      inputBlob: null,
      isLoadingPreview: false,
      uploadPreviewWidth: 0,
      uploadPreviewHeight: 0,
      uploadPreviewName: "",
      isProcessing: false,
      isCancelling: false,
      isProcessDone: false,
      isResultRevealing: false,
      mobileSettingsVisible: false,
      progressRate: 0,
      procFinalCostSeconds: null,
      progressTip: "",
      // output param
      outputPreviewWidth: 0,
      outputPreviewHeight: 0,
      outputScale: 0,
      outputDenoise: 0,
      outputModelType: "se",
      windowWidth: 0,
      windowHeight: 0,
      stageLayoutTick: 0,
      outputImgSrc: "",
      outputObjectUrl: "",
      isBatchActive: false,
      isBatchProcessing: false,
      batchCancelRequested: false,
      pendingUploadFile: null,
      pendingUploadFileList: [],
      batchItems: [],
      activeBatchItemId: null,
      selectedBatchItemId: null,
      batchRunId: 0,
      extractedThemeColors: null,
      designDots: [],
      wasmLoading: false,
      wasmLoadingProgress: 0,
      activeImageId: 0,
      safeProcessingMode: false,
      modelLoading: false,
      modelLoadingProgress: 0,
      modelLoadingName: "",
      modelLoadingFile: "",
      processFailureDialogOpen: false,
      elementRefs: markRaw<
        Partial<Record<WorkspaceRefName, Element | ComponentPublicInstance | null>>
      >({}),
      uploadRef: null,
      imageProcessor: markRaw(new ImageProcessor()),
      panVelocitySamples: [],
      panGlideFrame: null,
      revealWipeFrame: null,
      resultRevealTimer: null,
      windowResizeHandler: null,
      stageLayoutFrame: null,
      processCompletionResolve: null,
      processCompletionReject: null,
      batchSelectionTimer: null,
      modelLoadingTimer: null,
      handleDrawerKeydown: null,
      handlePasteEvent: null,
      removeDarkQueryListener: null,
      webReRevealObserver: null,
      webReParallaxNodes: null,
      webReParallaxX: -100,
      webReParallaxY: -100,
      webReParallaxTargetX: -100,
      webReParallaxTargetY: -100,
      webReParallaxFrame: null,
      webReParallaxPointerMove: null,
      infoPopoverOutsideHandler: null,
      splitDragStartX: 0,
      splitDragStartRate: 0
    }
  },

  computed: {
    batchDoneCount() {
      return this.batchItems.filter((item) => item.status === "done").length
    },

    batchProgressRate() {
      if (!this.batchItems.length) {
        return 0
      }
      return Math.round((this.batchDoneCount / this.batchItems.length) * 100)
    },

    batchDownloadCount() {
      return this.batchItems.filter((item) => !!item.objectUrl).length
    },

    // Cached render hot path: the template references this up to ~10
    // times per render, and during pan drags the component re-renders
    // every frame. As a computed it is evaluated once per dependency
    // change (stageLayoutTick / zoom / image sizes — notably NOT
    // previewPanX), instead of walking down to getBoundingClientRect
    // on every access.
    zoomedPreviewSize() {
      return this.getZoomedPreviewSize()
    },

    infoPopoverPlacement() {
      return this.windowWidth <= 768 ? "bottom" : "right-start"
    },

    isMobile() {
      return this.windowWidth <= 1120
    },

    getCurrentParamsText() {
      let model = this.modelTypeRadio === "pro" ? this.t("model.pro") : this.t("model.se")
      let scale = this.scaleRadio + "X"
      let denoiseLabel = this.getDenoiseLabel(this.denoiseRadio)
      return `${model} • ${scale} • ${denoiseLabel}`
    }
  },

  mounted() {
    // Timers, handlers and processor are initialized with the workspace state.

    this.language = this.getInitialLanguage()
    this.applyLanguage()

    // watch viewport size
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
    this.windowResizeHandler = () => {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
      // Leaving the mobile layout closes the drawer; otherwise the stale
      // flag would reopen it unexpectedly when shrinking back down.
      if (!this.isMobile && this.mobileSettingsVisible) {
        this.closeMobileSettings()
      }
      this.syncDrawerScrollLock()
      this.scheduleStageLayoutSync()
      this.syncPreviewViewport()
    }
    window.addEventListener("resize", this.windowResizeHandler)
    this.handleDrawerKeydown = (event) => {
      if (event.key !== "Escape") {
        return
      }
      if (this.isMobile && this.mobileSettingsVisible) {
        this.closeMobileSettings()
        return
      }
      // Viewer convention: Escape resets a zoomed result preview.
      if (this.isProcessDone && this.previewZoom > this.previewZoomMin) {
        this.resetPreviewZoom()
      }
    }
    document.addEventListener("keydown", this.handleDrawerKeydown)
    this.scheduleStageLayoutSync()

    // load preferences
    let scale = this.getPreference("scale")
    let denoise = this.getPreference("denoise")
    let modelType = this.getPreference("modelType")
    let backendMode = this.getPreference("backendMode")
    let themeMode = this.getPreference("themeMode")
    // Whitelist every persisted value: stale/hand-edited storage entries
    // (e.g. scale "5") would otherwise break the controls and 404
    // the model asset paths.
    if (scale && [2, 3, 4].includes(Number(scale))) {
      this.scaleRadio = Number(scale)
    }
    // Truthiness guard matters: null/'' coerce to 0, which is a valid
    // denoise level — an unset preference must not select "none".
    if ((denoise && [-1, 1, 2, 3].includes(Number(denoise))) || denoise === "0") {
      this.denoiseRadio = Number(denoise)
    }
    if (modelType === "se" || modelType === "pro") {
      this.modelTypeRadio = modelType
    }
    if (backendMode === "webgpu" || backendMode === "wasm") {
      this.backendMode = backendMode
    }
    this.normalizeModelOptions()
    if (themeMode === "auto" || themeMode === "light" || themeMode === "dark") {
      this.themeMode = themeMode
    }
    if (window.matchMedia) {
      let darkQuery = window.matchMedia("(prefers-color-scheme: dark)")
      // Seed BEFORE the first applyThemeMode() below, or auto mode
      // starts light regardless of the OS setting.
      this.systemPrefersDark = darkQuery.matches
      let onSystemThemeChange = () => {
        this.systemPrefersDark = darkQuery.matches
        if (this.themeMode === "auto") {
          this.applyThemeMode()
          if (this.extractedThemeColors) {
            this.applyExtractedThemeColors(this.extractedThemeColors)
          }
        }
      }
      if (darkQuery.addEventListener) {
        darkQuery.addEventListener("change", onSystemThemeChange)
      } else if (darkQuery.addListener) {
        darkQuery.addListener(onSystemThemeChange)
      }
      this.removeDarkQueryListener = () => {
        if (darkQuery.removeEventListener) {
          darkQuery.removeEventListener("change", onSystemThemeChange)
        } else if (darkQuery.removeListener) {
          darkQuery.removeListener(onSystemThemeChange)
        }
      }
    }
    this.applyThemeMode()

    this.infoPopoverOutsideHandler = (event) => this.handleInfoPopoverOutside(event)
    document.addEventListener("mousedown", this.infoPopoverOutsideHandler)
    document.addEventListener("touchstart", this.infoPopoverOutsideHandler, { passive: true })

    this.handlePasteEvent = (event) => {
      if (this.isProcessing || this.isBatchProcessing) {
        return
      }
      const clipboardData = event.clipboardData
      if (!clipboardData) {
        return
      }
      const items = clipboardData.items
      let file = null
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image/") === 0) {
          file = items[i].getAsFile()
          break
        }
      }
      if (file) {
        let fakeFile = {
          name: "pasted-image-" + Date.now() + ".png",
          raw: file
        }
        this.onUploadChange(fakeFile, [fakeFile])
      }
    }
    document.addEventListener("paste", this.handlePasteEvent)
    this.initWebReMotion()
  },

  beforeUnmount() {
    this.activeImageId += 1
    if (this.windowResizeHandler) {
      window.removeEventListener("resize", this.windowResizeHandler)
      this.windowResizeHandler = null
    }
    if (this.stageLayoutFrame) {
      cancelAnimationFrame(this.stageLayoutFrame)
      this.stageLayoutFrame = null
    }
    if (this.infoPopoverOutsideHandler) {
      document.removeEventListener("mousedown", this.infoPopoverOutsideHandler)
      document.removeEventListener("touchstart", this.infoPopoverOutsideHandler)
    }
    if (this.handlePasteEvent) {
      document.removeEventListener("paste", this.handlePasteEvent)
    }
    if (this.handleDrawerKeydown) {
      document.removeEventListener("keydown", this.handleDrawerKeydown)
    }
    document.body.style.overflow = ""
    this.cancelPanGlide()
    this.cancelRevealWipeSweep()
    this.clearResultReveal()
    this.finishModelLoading()
    clearTimeout(this.batchSelectionTimer ?? undefined)
    this.clearUploadPreviewUrl()
    this.clearOutputPreviewUrl()
    this.clearBatchResults()
    if (this.removeDarkQueryListener) {
      this.removeDarkQueryListener()
    }
    this.imageProcessor.dispose()
    this.destroyWebReMotion()
  },

  methods: {
    initWebReMotion() {
      const root = this.$el
      if (!(root instanceof HTMLElement)) return
      const revealNodes = root.querySelectorAll<HTMLElement>("[data-reveal]")
      // Release compositor layers after the reveal transition.
      let releaseWillChange = (node: HTMLElement) => {
        node.addEventListener("transitionend", function handler(event) {
          if (event.target === node && event.propertyName === "opacity") {
            node.style.willChange = "auto"
            node.removeEventListener("transitionend", handler)
          }
        })
      }
      // Reveal via an attribute, NOT a class: some reveal targets also
      // carry Vue :class bindings, and Vue rewrites the whole class
      // attribute on re-render — wiping an externally added class and
      // snapping the element back to opacity 0 mid-session.
      if ("IntersectionObserver" in window) {
        this.webReRevealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (entry.target instanceof HTMLElement) releaseWillChange(entry.target)
                entry.target.setAttribute("data-reveal-shown", "")
                this.webReRevealObserver?.unobserve(entry.target)
              }
            })
          },
          { threshold: 0.05 }
        )
        revealNodes.forEach((node) => this.webReRevealObserver?.observe(node))
      } else {
        revealNodes.forEach((node) => {
          node.setAttribute("data-reveal-shown", "")
          node.style.willChange = "auto"
        })
      }

      if (
        !window.matchMedia ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.matchMedia("(min-width: 1121px) and (hover: hover) and (pointer: fine)").matches
      ) {
        return
      }
      this.webReParallaxNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"))
      this.webReParallaxX = -100
      this.webReParallaxY = -100
      this.webReParallaxTargetX = -100
      this.webReParallaxTargetY = -100
      // Cache parallax depths once; getAttribute per pointermove is wasted work.
      let parallaxDepths = this.webReParallaxNodes.map(
        (node) => Number(node.getAttribute("data-parallax")) || 1
      )
      let pointerDirty = false
      let parallaxFrame = () => {
        this.webReParallaxX += (this.webReParallaxTargetX - this.webReParallaxX) * 0.18
        this.webReParallaxY += (this.webReParallaxTargetY - this.webReParallaxY) * 0.18
        if (pointerDirty) {
          pointerDirty = false
          let nx = this.webReParallaxTargetX / window.innerWidth - 0.5
          let ny = this.webReParallaxTargetY / window.innerHeight - 0.5
          this.webReParallaxNodes?.forEach((node, i) => {
            let depth = parallaxDepths[i]
            node.style.transform = `translate3d(${nx * depth * 20}px, ${ny * depth * 20}px, 0)`
          })
        }
        if (
          pointerDirty ||
          Math.abs(this.webReParallaxTargetX - this.webReParallaxX) > 0.1 ||
          Math.abs(this.webReParallaxTargetY - this.webReParallaxY) > 0.1
        ) {
          this.webReParallaxFrame = requestAnimationFrame(parallaxFrame)
        } else {
          this.webReParallaxFrame = null
        }
      }
      this.webReParallaxPointerMove = (event) => {
        this.webReParallaxTargetX = event.clientX
        this.webReParallaxTargetY = event.clientY
        pointerDirty = true
        if (!this.webReParallaxFrame) {
          this.webReParallaxFrame = requestAnimationFrame(parallaxFrame)
        }
      }
      window.addEventListener("pointermove", this.webReParallaxPointerMove, { passive: true })
    },

    destroyWebReMotion() {
      if (this.webReRevealObserver) {
        this.webReRevealObserver.disconnect()
      }
      if (this.webReParallaxFrame) {
        cancelAnimationFrame(this.webReParallaxFrame)
        this.webReParallaxFrame = null
      }
      if (this.webReParallaxPointerMove) {
        window.removeEventListener("pointermove", this.webReParallaxPointerMove)
      }
      this.webReParallaxNodes = null
    },

    setElementRef(name: WorkspaceRefName, value: Element | ComponentPublicInstance | null) {
      this.elementRefs[name] = value
      if (name === "imageUpload") {
        this.uploadRef =
          value && !(value instanceof Element) && isUploadInstance(value) ? value : null
      }
    },

    getRefElement(refName: WorkspaceRefName): HTMLElement | null {
      const ref = this.elementRefs[refName]
      if (!ref) return null
      const element: unknown = ref instanceof Element ? ref : ref.$el
      return element instanceof HTMLElement ? element : null
    },

    getStageSurfaceElement() {
      return this.getRefElement("stageSurface")
    },

    getPreviewViewportElement() {
      return this.getRefElement("previewViewport")
    },

    openMobileSettings() {
      this.mobileSettingsVisible = true
      this.syncDrawerScrollLock()
      // Move keyboard/SR focus into the sheet; the FAB it came from
      // is removed by v-if the moment the drawer opens.
      void this.$nextTick(() => {
        let closeButton = this.getRefElement("drawerCloseButton")
        if (closeButton && closeButton.focus) {
          closeButton.focus()
        }
      }).catch((error: unknown) => Logger.error("Failed to focus drawer close button:", error))
    },

    closeMobileSettings() {
      this.mobileSettingsVisible = false
      this.syncDrawerScrollLock()
      void this.$nextTick(() => {
        let fab = this.getRefElement("mobileSettingsFab")
        if (fab && fab.focus) {
          fab.focus()
        }
      }).catch((error: unknown) => Logger.error("Failed to restore settings focus:", error))
    },

    toggleMobileSettings() {
      this.mobileSettingsVisible = !this.mobileSettingsVisible
      this.syncDrawerScrollLock()
    },

    syncDrawerScrollLock() {
      // Lock the page behind the open bottom sheet.
      let locked = this.isMobile && this.mobileSettingsVisible
      document.body.style.overflow = locked ? "hidden" : ""
    },

    t(key: string, params?: object) {
      const lookup = (locale: object): unknown =>
        key.split(".").reduce<unknown>((value, part) => {
          if (value && typeof value === "object" && part in value) {
            return value[part as keyof typeof value]
          }
          return undefined
        }, locale)
      let value = lookup(I18N[this.language as keyof typeof I18N] || I18N.zh)
      if (typeof value !== "string") {
        value = lookup(I18N.zh)
      }
      if (typeof value !== "string") {
        return key
      }
      let translated = value
      if (params) {
        Object.entries(params).forEach(([name, replacement]) => {
          // Function replacement preserves literal $ sequences in error text.
          translated = translated.replace(new RegExp("\\{" + name + "\\}", "g"), () =>
            String(replacement)
          )
        })
      }
      return translated
    },

    getInitialLanguage() {
      // The query parameter takes precedence over saved and browser preferences.
      let pageLanguage = new URLSearchParams(window.location.search).get("lang")
      if (pageLanguage === "zh" || pageLanguage === "en" || pageLanguage === "ja") {
        return pageLanguage
      }
      let savedLanguage = this.getPreference("language")
      if (savedLanguage === "zh" || savedLanguage === "en" || savedLanguage === "ja") {
        return savedLanguage
      }
      let browserLanguage = (
        navigator.language ||
        ("userLanguage" in navigator && typeof navigator.userLanguage === "string"
          ? navigator.userLanguage
          : "")
      ).toLowerCase()
      if (browserLanguage.indexOf("ja") === 0) {
        return "ja"
      }
      return browserLanguage.indexOf("zh") === 0 ? "zh" : "en"
    },

    applyLanguage() {
      document.documentElement.lang =
        this.language === "ja" ? "ja" : this.language === "en" ? "en" : "zh-CN"
      document.title = this.t("app.title")
      let descriptionMeta = document.querySelector('meta[name="description"]')
      if (descriptionMeta) {
        descriptionMeta.setAttribute("content", this.t("app.description"))
      }
    },

    setLanguage(language: string) {
      if (language !== "zh" && language !== "en" && language !== "ja") {
        return
      }
      this.language = language
      this.savePreference("language", language)
      this.applyLanguage()
      this.syncProgressTipLanguage()
      const url = new URL(window.location.href)
      url.searchParams.set("lang", language)
      window.history.replaceState(null, "", url)
    },

    getLanguageLabel() {
      if (this.language === "zh") {
        return "中文"
      }
      if (this.language === "ja") {
        return "日本語"
      }
      return "English"
    },

    showInfoPopover() {
      this.projectInfoVisible = true
    },

    hideInfoPopover() {
      if (!this.projectInfoPinned) {
        this.projectInfoVisible = false
      }
    },

    toggleInfoPopover() {
      let nextVisible = !(this.projectInfoVisible && this.projectInfoPinned)
      this.projectInfoVisible = nextVisible
      this.projectInfoPinned = nextVisible
    },

    closeInfoPopovers() {
      this.projectInfoVisible = false
      this.projectInfoPinned = false
    },

    handleInfoPopoverOutside(event: Event) {
      if (!this.projectInfoVisible) {
        return
      }
      let target = event.target
      if (!(target instanceof Element)) {
        this.closeInfoPopovers()
        return
      }
      if (target.closest(".info-button") || target.closest(".info-popover")) {
        return
      }
      this.closeInfoPopovers()
    },

    getEffectiveTheme() {
      if (this.themeMode === "dark" || this.themeMode === "light") {
        return this.themeMode
      }
      // Reactive prop (kept in sync by the matchMedia listener) so the
      // theme toggle icon re-renders when the OS theme flips.
      return this.systemPrefersDark ? "dark" : "light"
    },

    applyThemeMode() {
      let effectiveTheme = this.getEffectiveTheme()
      document.documentElement.setAttribute("data-theme", effectiveTheme)
      document.documentElement.setAttribute("data-theme-mode", this.themeMode)
      // app.css has a set of `.dark ...` rules (starfield, card
      // shadows, ambient blend modes); without this class they never
      // applied and dark mode silently lost those styles.
      document.documentElement.classList.toggle("dark", effectiveTheme === "dark")
    },

    setThemeMode(themeMode: string) {
      if (themeMode !== "auto" && themeMode !== "light" && themeMode !== "dark") {
        return
      }
      let previousEffective = this.getEffectiveTheme()
      let apply = () => {
        this.themeMode = themeMode
        this.savePreference("themeMode", themeMode)
        this.applyThemeMode()
        if (this.extractedThemeColors) {
          this.applyExtractedThemeColors(this.extractedThemeColors)
        }
      }
      // Circular reveal from the toggle button (View Transitions API).
      // Falls back to the plain CSS variable cross-fade elsewhere.
      let toggleButton = document.querySelector(
        '.topnav-btn[aria-label*="' + this.t("nav.theme") + '"]'
      )
      let willChange =
        themeMode === "dark" || themeMode === "light"
          ? themeMode !== previousEffective
          : (this.systemPrefersDark ? "dark" : "light") !== previousEffective
      if (
        !document.startViewTransition ||
        !toggleButton ||
        !willChange ||
        (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      ) {
        apply()
        return
      }
      let rect = toggleButton.getBoundingClientRect()
      let cx = rect.left + rect.width / 2
      let cy = rect.top + rect.height / 2
      let radius = Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy)
      )
      let transition = document.startViewTransition(apply)
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                "circle(0px at " + cx + "px " + cy + "px)",
                "circle(" + Math.ceil(radius) + "px at " + cx + "px " + cy + "px)"
              ]
            },
            {
              duration: 480,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)"
            }
          )
        })
        .catch(() => {})
    },

    getThemeModeLabel() {
      return this.t("theme." + this.themeMode)
    },

    getThemeIconClass() {
      return this.getEffectiveTheme() === "dark" ? "el-icon-moon" : "el-icon-sunny"
    },

    syncProgressTipLanguage() {
      if (this.isProcessDone && this.procFinalCostSeconds !== null) {
        this.progressTip = this.t("progress.done", { seconds: this.procFinalCostSeconds })
        return
      }
      if (this.isProcessing) {
        this.progressTip =
          this.progressRate > 0 ? this.t("progress.processing") : this.t("progress.starting")
      }
    },

    // Shared tail for every model-option change: normalize combinations,
    // persist all three prefs (current values, so always safe), prefetch.
    persistModelOptions() {
      this.normalizeModelOptions()
      this.savePreference("scale", "" + this.scaleRadio)
      this.savePreference("denoise", "" + this.denoiseRadio)
      this.savePreference("modelType", this.modelTypeRadio)
    },

    onScaleOptionChange() {
      this.persistModelOptions()
    },

    isDesignScaleHidden(scale: number) {
      return this.modelTypeRadio === "pro" && scale === 4
    },

    getVisibleDesignScales() {
      return this.modelTypeRadio === "pro" ? [2, 3] : [2, 3, 4]
    },

    getDesignScaleBarLeft() {
      let visibleScales = this.getVisibleDesignScales()
      let index = Math.max(0, visibleScales.indexOf(this.scaleRadio))
      return index * (100 / visibleScales.length)
    },

    setDesignScale(scale: number) {
      if (this.isDesignScaleHidden(scale)) {
        return
      }
      this.scaleRadio = scale
      this.onScaleOptionChange()
    },

    onDenoiseOptionChange() {
      this.persistModelOptions()
    },

    getDesignDenoiseOptions() {
      return [
        { value: -1, label: this.t("denoise.conservative") },
        { value: 0, label: this.t("denoise.none") },
        { value: 1, label: "1" },
        { value: 2, label: "2" },
        { value: 3, label: "3" }
      ]
    },

    setDesignDenoise(denoise: number) {
      if (this.isDenoiseDisabled(denoise)) {
        return
      }
      this.denoiseRadio = denoise
      this.onDenoiseOptionChange()
    },

    startDesignDenoiseScrub(event: PointerEvent) {
      this.designDenoiseScrubbing = true
      const element = event.currentTarget
      if (element instanceof Element) {
        if (element.setPointerCapture) {
          element.setPointerCapture(event.pointerId)
        }
        this.pickDesignDenoise(event.clientX, element)
      }
    },

    moveDesignDenoiseScrub(event: PointerEvent) {
      if (this.designDenoiseScrubbing && event.currentTarget instanceof Element) {
        this.pickDesignDenoise(event.clientX, event.currentTarget)
      }
    },

    endDesignDenoiseScrub() {
      this.designDenoiseScrubbing = false
    },

    pickDesignDenoise(clientX: number, element: Element) {
      let visibleOptions = this.getDesignDenoiseOptions().filter(
        (option) => !this.isDenoiseDisabled(option.value)
      )
      let rect = element.getBoundingClientRect()
      let index = Math.max(
        0,
        Math.min(
          visibleOptions.length - 1,
          Math.floor(((clientX - rect.left) / rect.width) * visibleOptions.length)
        )
      )
      this.setDesignDenoise(visibleOptions[index].value)
    },

    onModelTypeOptionChange(value: string | number | boolean | undefined) {
      if (value !== "se" && value !== "pro") return
      this.modelTypeRadio = value
      this.persistModelOptions()
    },

    onBackendOptionChange(value: string | number | boolean | undefined) {
      if (this.isProcessing || this.isBatchProcessing || (value !== "webgpu" && value !== "wasm"))
        return
      this.backendMode = value
      this.savePreference("backendMode", value)
    },

    isDenoiseDisabled(denoise: number) {
      if (this.modelTypeRadio === "pro") {
        return denoise === 1 || denoise === 2
      }
      if (this.scaleRadio === 2) {
        return false
      }
      return denoise === 1 || denoise === 2
    },

    normalizeModelOptions() {
      if (this.modelTypeRadio === "pro" && this.scaleRadio === 4) {
        this.scaleRadio = 2
      }
      if (this.isDenoiseDisabled(this.denoiseRadio)) {
        this.denoiseRadio = 3
      }
    },

    // try/catch: merely touching window.localStorage throws SecurityError
    // when site data is blocked (Chrome setting, old Safari private mode),
    // and getPreference runs at the very top of mounted().
    // Keys carry an 'rc:' prefix to avoid collisions on shared origins;
    // reads fall back to (and migrate) the legacy bare keys.
    savePreference(key: string, val: string) {
      try {
        localStorage.setItem("rc:" + key, val)
      } catch {
        // Storage unavailable — preferences just don't persist.
      }
    },

    getPreference(key: string) {
      try {
        let value = localStorage.getItem("rc:" + key)
        if (value !== null) {
          return value
        }
        let legacy = localStorage.getItem(key)
        if (legacy !== null) {
          localStorage.setItem("rc:" + key, legacy)
          localStorage.removeItem(key)
        }
        return legacy
      } catch {
        return null
      }
    },

    clampColorValue(value: number, min: number, max: number) {
      return Math.max(min, Math.min(max, value))
    },

    rgbCss(color: RGB) {
      return "rgb(" + color.r + ", " + color.g + ", " + color.b + ")"
    },

    getReadableTextOnColor(color: RGB) {
      return colord(color).luminance() > 0.36 ? "#111827" : "#ffffff"
    },

    getContrastingHueColor(color: RGB, background: RGB, minimumRatio: number) {
      let hsl = colord({ r: color.r, g: color.g, b: color.b }).toHsl()
      let backgroundLuminance = colord(background).luminance()
      let direction = backgroundLuminance < 0.5 ? 1 : -1
      let candidate = color
      for (let lightness = hsl.l; lightness >= 8 && lightness <= 92; lightness += direction * 4) {
        candidate = colord({ h: hsl.h, s: hsl.s, l: lightness }).toRgb()
        if (colord(candidate).contrast(background) >= minimumRatio) {
          return candidate
        }
      }
      return colord({ h: hsl.h, s: hsl.s, l: direction > 0 ? 92 : 8 }).toRgb()
    },

    extractThemeColors(imageData: ImageData, limit: number) {
      let data = imageData.data
      let pixelCount = imageData.width * imageData.height
      let stride = Math.max(4, Math.floor(pixelCount / 6000) * 4)
      let buckets: Record<string, RGB & { weight: number; score: number }> = {}
      for (let i = 0; i < data.length; i += stride) {
        let a = data[i + 3]
        if (a < 180) {
          continue
        }
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]
        let hsl = colord({ r: r, g: g, b: b }).toHsl()
        if (hsl.s < 18 || hsl.l < 18 || hsl.l > 88) {
          continue
        }
        let hKey = Math.round(hsl.h / 10) * 10
        let sKey = Math.round(hsl.s / 10) * 10
        let lKey = Math.round(hsl.l / 10) * 10
        let key = hKey + ":" + sKey + ":" + lKey
        let balance = 1 - Math.abs(hsl.l - 52) / 52
        let score = hsl.s * 1.4 + balance * 60
        if (!buckets[key]) {
          buckets[key] = { r: 0, g: 0, b: 0, weight: 0, score: 0 }
        }
        buckets[key].r += r * score
        buckets[key].g += g * score
        buckets[key].b += b * score
        buckets[key].weight += score
        buckets[key].score += score
      }
      let ranked = Object.keys(buckets)
        .map((key) => {
          let bucket = buckets[key]
          return {
            r: Math.round(bucket.r / bucket.weight),
            g: Math.round(bucket.g / bucket.weight),
            b: Math.round(bucket.b / bucket.weight),
            score: bucket.score
          }
        })
        .sort((a, b) => b.score - a.score)
      let selected: RGB[] = []
      ranked.forEach((candidate) => {
        if (selected.length >= limit) {
          return
        }
        let distinct = selected.every((color) => {
          let delta =
            Math.abs(candidate.r - color.r) +
            Math.abs(candidate.g - color.g) +
            Math.abs(candidate.b - color.b)
          return delta > 72
        })
        if (distinct) {
          selected.push(candidate)
        }
      })
      if (selected.length === 0) {
        selected.push({ r: 64, g: 158, b: 255 })
      }
      while (selected.length < limit) {
        let base = selected[0]
        let hsl = colord({ r: base.r, g: base.g, b: base.b }).toHsl()
        let next = colord({
          h: (hsl.h + selected.length * 38) % 360,
          s: this.clampColorValue(hsl.s, 35, 76),
          l: this.clampColorValue(hsl.l + (selected.length % 2 === 0 ? 12 : -8), 36, 72)
        }).toRgb()
        selected.push(next)
      }
      return selected.slice(0, limit)
    },

    buildThemePalette(colors: RGB[], isDarkTheme: boolean) {
      let color = colors[0]
      let hsl = colord({ r: color.r, g: color.g, b: color.b }).toHsl()
      let primary = colord({
        h: hsl.h,
        s: this.clampColorValue(hsl.s, 42, 78),
        l: isDarkTheme
          ? this.clampColorValue(hsl.l + 4, 42, 56)
          : this.clampColorValue(hsl.l, 34, 52)
      }).toRgb()
      let soft = colord({
        h: hsl.h,
        s: this.clampColorValue(hsl.s, 24, 58),
        l: isDarkTheme ? 14 : 94
      }).toRgb()
      let border = colord({
        h: hsl.h,
        s: this.clampColorValue(hsl.s, 20, 52),
        l: isDarkTheme ? 28 : 78
      }).toRgb()
      let textStrong = isDarkTheme
        ? colord({ h: hsl.h, s: 24, l: 92 }).toRgb()
        : colord({ h: hsl.h, s: 28, l: 20 }).toRgb()
      let readyBadge = this.getContrastingHueColor(primary, { r: 20, g: 12, b: 24 }, 4.5)
      let fluidColors = colors.map((themeColor) => {
        let colorHsl = colord({ r: themeColor.r, g: themeColor.g, b: themeColor.b }).toHsl()
        let fluid = colord({
          h: colorHsl.h,
          s: this.clampColorValue(colorHsl.s, 45, 82),
          l: isDarkTheme
            ? this.clampColorValue(colorHsl.l - 8, 28, 50)
            : this.clampColorValue(colorHsl.l, 46, 68)
        }).toRgb()
        return (
          "rgba(" +
          fluid.r +
          ", " +
          fluid.g +
          ", " +
          fluid.b +
          ", " +
          (isDarkTheme ? "0.66" : "0.72") +
          ")"
        )
      })
      return {
        primary: this.rgbCss(primary),
        soft: this.rgbCss(soft),
        border: this.rgbCss(border),
        surfaceTint:
          "rgba(" +
          primary.r +
          ", " +
          primary.g +
          ", " +
          primary.b +
          ", " +
          (isDarkTheme ? "0.14" : "0.08") +
          ")",
        textStrong: this.rgbCss(textStrong),
        onPrimary: this.getReadableTextOnColor(primary),
        readyBadge: this.rgbCss(readyBadge),
        fluidColors: fluidColors
      }
    },

    applyThemePalette(palette: ThemePalette) {
      let root = document.documentElement
      root.style.setProperty("--theme-primary", palette.primary)
      root.style.setProperty("--theme-primary-soft", palette.soft)
      root.style.setProperty("--theme-primary-border", palette.border)
      root.style.setProperty("--theme-surface-tint", palette.surfaceTint)
      root.style.setProperty("--theme-text-strong", palette.textStrong)
      root.style.setProperty("--theme-on-primary", palette.onPrimary)
      palette.fluidColors.forEach((color, index) => {
        root.style.setProperty("--fluid-color-" + (index + 1), color)
      })
      root.style.setProperty("--c-primary", palette.primary)
      root.style.setProperty("--c-on-primary", palette.onPrimary)
      root.style.setProperty(
        "--c-secondary",
        palette.fluidColors[1] || palette.fluidColors[0] || palette.primary
      )
      root.style.setProperty(
        "--c-tertiary",
        palette.fluidColors[2] || palette.fluidColors[0] || palette.primary
      )
      root.style.setProperty("--c-surface-tint", palette.primary)
      root.style.setProperty("--brand-suffix-color", palette.primary)
      root.style.setProperty("--ready-badge-color", palette.readyBadge)
    },

    applyImageTheme(imageData: ImageData) {
      let colors = this.extractThemeColors(imageData, 4)
      this.extractedThemeColors = colors
      this.applyExtractedThemeColors(colors)
    },

    applyExtractedThemeColors(colors: RGB[]) {
      let isDarkTheme = this.getEffectiveTheme() === "dark"
      this.applyThemePalette(this.buildThemePalette(colors, isDarkTheme))
    },

    resetTheme() {
      ;[
        "--theme-primary",
        "--theme-primary-soft",
        "--theme-primary-border",
        "--theme-surface-tint",
        "--theme-text-strong",
        "--theme-on-primary",
        "--fluid-color-1",
        "--fluid-color-2",
        "--fluid-color-3",
        "--fluid-color-4",
        "--c-primary",
        "--c-on-primary",
        "--c-secondary",
        "--c-tertiary",
        "--c-surface-tint",
        "--brand-suffix-color",
        "--ready-badge-color"
      ].forEach((name) => document.documentElement.style.removeProperty(name))
      this.extractedThemeColors = null
    },

    getDenoiseLabel(denoise: number) {
      if (denoise === -1) {
        return this.t("denoise.conservative")
      }
      if (denoise === 0) {
        return this.t("denoise.none")
      }
      return denoise + "X"
    },

    getModelDisplayName(scale: number, denoise: number, modelType: string) {
      return this.t("model." + modelType) + " " + scale + "X / " + this.getDenoiseLabel(denoise)
    },

    formatModelLoadingTip(files: { label: string } | null, file: string, progress: number) {
      if (files && files.label && file) {
        return this.t("progress.loadingModelFile", {
          model: files.label,
          file: file,
          percent: progress
        })
      }
      return this.t("progress.loadingModel", { percent: progress })
    },

    startModelLoading(files: { label: string } | null, progress: number, file: string) {
      this.modelLoadingProgress = progress
      this.modelLoadingName = files && files.label ? files.label : ""
      this.modelLoadingFile = file || ""
      if (this.modelLoading) {
        this.progressTip = this.formatModelLoadingTip(files, file, progress)
        return
      }
      if (!this.modelLoadingTimer) {
        this.modelLoadingTimer = setTimeout(() => {
          this.modelLoadingTimer = null
          if (!this.modelLoadingName && !this.modelLoadingFile) {
            return
          }
          this.modelLoading = true
          this.progressTip = this.formatModelLoadingTip(
            { label: this.modelLoadingName },
            this.modelLoadingFile,
            this.modelLoadingProgress
          )
        }, 120)
      }
    },

    finishModelLoading() {
      if (this.modelLoadingTimer) {
        clearTimeout(this.modelLoadingTimer)
        this.modelLoadingTimer = null
      }
      this.modelLoading = false
      this.modelLoadingProgress = 0
      this.modelLoadingName = ""
      this.modelLoadingFile = ""
    },

    onUploadChange(file: WorkspaceFile, fileList: WorkspaceFile[]) {
      if (this.isProcessing || this.isBatchProcessing || this.isLoadingPreview) return
      if (!file || !file.raw) {
        return
      }
      this.pendingUploadFile = file
      this.pendingUploadFileList = (fileList || []).slice()
      if (this.batchSelectionTimer) {
        clearTimeout(this.batchSelectionTimer)
      }
      this.batchSelectionTimer = setTimeout(() => {
        let selectedFile = this.pendingUploadFile
        let selectedList = this.pendingUploadFileList
        this.batchSelectionTimer = null
        this.pendingUploadFile = null
        this.pendingUploadFileList = []
        if (selectedList && selectedList.length > 1) {
          this.startBatchProcess(selectedList)
          return
        }
        if (selectedFile) this.readUploadedFile(selectedFile)
      }, 120)
    },

    readUploadedFile(file: WorkspaceFile | null) {
      this.isLoadingPreview = true
      this.loadImageFileToCanvas(file)
        .then(() => {
          this.scheduleStageLayoutSync()
          this.scrollStageIntoView()
          this.progressTip = ""
        })
        .catch((error) => {
          if (error instanceof Error && error.name === "AbortError") return
          this.clearUploadPreviewUrl()
          this.inputBlob = null
          this.uploadPreviewWidth = 0
          this.uploadPreviewHeight = 0
          this.handleProcessFailure(error || "failed to decode input image")
        })
        .finally(() => {
          this.isLoadingPreview = false
        })
    },

    async loadImageFileToCanvas(file: WorkspaceFile | null, item?: BatchItem) {
      if (!file?.raw) throw new Error("missing input file")
      const imageId = ++this.activeImageId
      this.inputBlob = null
      this.clearUploadPreviewUrl()
      this.uploadPreviewWidth = 0
      this.uploadPreviewHeight = 0
      const preview = await this.imageProcessor.preview(file.raw)
      if (imageId !== this.activeImageId || this.batchCancelRequested)
        throw new DOMException("processing cancelled", "AbortError")
      const url = URL.createObjectURL(preview.blob)
      const image = new Image()
      try {
        image.src = url
        await image.decode()
        if (imageId !== this.activeImageId || this.batchCancelRequested)
          throw new DOMException("processing cancelled", "AbortError")
        const canvas = document.getElementById("canvas-upload")
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error("missing upload canvas")
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const context = canvas.getContext("2d")
        if (!context || !canvas.width || !canvas.height)
          throw new Error("failed to decode input preview")
        context.drawImage(image, 0, 0)
        this.applyImageThemeFromCanvas(canvas)
        this.buildWebReDots(canvas)
        if (item) {
          this.applyBatchItemAccentFromCanvas(item, canvas)
          if (item.previewObjectUrl) URL.revokeObjectURL(item.previewObjectUrl)
          item.previewObjectUrl = url
        }
        this.inputBlob = file.raw
        this.uploadObjectUrl = url
        this.uploadImgSrc = url
        this.uploadPreviewWidth = preview.width
        this.uploadPreviewHeight = preview.height
        this.uploadPreviewName = file.name
      } catch (error) {
        URL.revokeObjectURL(url)
        throw error
      }
    },

    getReadyWipeLines() {
      return [
        `${this.scaleRadio}X：${this.uploadPreviewWidth}×${this.uploadPreviewHeight} → ${this.uploadPreviewWidth * this.scaleRadio}×${this.uploadPreviewHeight * this.scaleRadio}`,
        `${this.getDenoiseLabel(this.denoiseRadio)} ${this.t("controls.denoise")}`,
        `${this.modelTypeRadio === "pro" ? this.t("model.pro") : this.t("model.se")} ${this.t("controls.model")}`
      ]
    },

    startReadyProcess() {
      if (!this.uploadPreviewWidth || this.isProcessing || this.isProcessDone) {
        return
      }
      if (!this.inputBlob) return
      this.preflightProcess(
        this.inputBlob,
        this.uploadPreviewWidth,
        this.uploadPreviewHeight
      ).catch((error) => {
        // Covers both 'processing cancelled before start' (declined
        // the size-risk dialog) and 'processing cancelled' (user hit
        // cancel mid-run) — neither is a failure to report.
        if (error instanceof Error && error.message.indexOf("processing cancelled") === 0) {
          return
        }
        this.handleProcessFailure(error || "failed to start processing")
      })
    },

    buildWebReDots(sourceCanvas: HTMLCanvasElement) {
      // Half density on mobile leaves room for inference.
      const width = this.isMobile ? 19 : 38
      const height = this.isMobile ? 12 : 24
      const sample = document.createElement("canvas")
      sample.width = width
      sample.height = height
      const context = sample.getContext("2d", { willReadFrequently: true })
      if (!context) throw new Error("failed to get canvas context")
      context.drawImage(sourceCanvas, 0, 0, width, height)
      const pixels = context.getImageData(0, 0, width, height).data
      const dots = []
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4
          const nx = x / (width - 1)
          const ny = y / (height - 1)
          const distance = Math.hypot(nx - 0.5, ny - 0.5) * Math.SQRT2
          dots.push({
            color: `rgb(${pixels[offset]}, ${pixels[offset + 1]}, ${pixels[offset + 2]})`,
            nx: nx,
            ny: ny,
            delay: Number((distance * 0.75).toFixed(3))
          })
        }
      }
      // Freeze so Vue skips reactive observation of ~900 static dot objects.
      this.designDots = Object.freeze(dots)
      sample.width = 0
      sample.height = 0
    },

    startProcessAndWait(sourceBlob: Blob, w: number, h: number) {
      return new Promise<ProcessResult>((resolve, reject) => {
        this.processCompletionResolve = resolve
        this.processCompletionReject = reject
        let processPromise = this.process(sourceBlob, w, h)
        if (processPromise && processPromise.catch) {
          processPromise.catch((error) => {
            this.rejectCurrentProcess(error)
          })
        }
      })
    },

    resolveCurrentProcess(result: ProcessResult) {
      let resolve = this.processCompletionResolve
      this.processCompletionResolve = null
      this.processCompletionReject = null
      if (resolve) {
        resolve(result)
      }
    },

    rejectCurrentProcess(error: unknown) {
      let reject = this.processCompletionReject
      this.processCompletionResolve = null
      this.processCompletionReject = null
      if (reject) {
        reject(error || new Error("processing failed"))
      }
    },

    startBatchProcess(fileList: WorkspaceFile[]) {
      let files = (fileList || []).filter(
        (file): file is WorkspaceFile & { raw: Blob } => !!file && !!file.raw
      )
      if (files.length <= 1) {
        return
      }
      if (this.isProcessing || this.isBatchProcessing) {
        ElNotification({
          title: this.t("notify.busy"),
          message: this.t("batch.busy"),
          type: "warning"
        })
        return
      }
      void this.runBatchQueue(files)
    },

    async runBatchQueue(files: (WorkspaceFile & { raw: Blob })[]) {
      this.resetWorkspace({ keepBatch: true })
      // Revoke the previous batch's object URLs before replacing
      // batchItems; resetWorkspace({keepBatch: true}) skips this.
      this.clearBatchResults()
      this.batchRunId += 1
      let runId = this.batchRunId
      this.isBatchActive = true
      this.isBatchProcessing = true
      this.batchCancelRequested = false
      this.batchItems = files.map((file, index) => ({
        id: runId + "-" + index,
        file: file,
        name: file.name,
        status: "pending",
        previewObjectUrl: "",
        outputPreviewObjectUrl: "",
        inputWidth: 0,
        inputHeight: 0,
        outputWidth: 0,
        outputHeight: 0,
        outputScale: 0,
        outputDenoise: 0,
        outputModelType: "se",
        accentColor: "",
        accentSoftColor: "",
        accentTextColor: "",
        filename: "",
        objectUrl: ""
      }))
      this.selectedBatchItemId = this.batchItems.length ? this.batchItems[0].id : null
      this.progressTip = this.t("batch.queued", { total: this.batchItems.length })
      this.scheduleStageLayoutSync()

      // Snapshot the model options: every item in this batch processes
      // with the settings from when it started, even if the user
      // changes the controls mid-run (they'd otherwise silently apply
      // to the remaining items — inconsistent output, and a mid-batch
      // jump to 4X can OOM).
      let batchOptions = {
        scale: this.scaleRadio,
        denoise: this.denoiseRadio,
        modelType: this.modelTypeRadio
      }

      for (let index = 0; index < this.batchItems.length; index++) {
        if (this.batchCancelRequested || runId !== this.batchRunId) {
          break
        }
        // Restore the snapshot before each item; the controls visibly
        // snap back, signalling that batch settings are locked.
        this.scaleRadio = batchOptions.scale
        this.denoiseRadio = batchOptions.denoise
        this.modelTypeRadio = batchOptions.modelType
        let item = this.batchItems[index]
        this.activeBatchItemId = item.id
        this.selectedBatchItemId = item.id
        item.status = "processing"
        this.progressTip = this.t("batch.processing", {
          current: index + 1,
          total: this.batchItems.length,
          name: item.name
        })
        try {
          await this.loadImageFileToCanvas(item.file, item)
          item.inputWidth = this.uploadPreviewWidth
          item.inputHeight = this.uploadPreviewHeight
          this.scheduleStageLayoutSync()
          this.scrollStageIntoView()
          if (!item.file.raw) throw new Error("missing input file")
          await this.preflightProcess(item.file.raw, item.inputWidth, item.inputHeight)
          item.status = "done"
        } catch (error) {
          if (this.batchCancelRequested || this.isCancelling) {
            item.status = "cancelled"
            break
          }
          item.status = "error"
          Logger.error("batch item failed:", item.name, error)
        }
      }

      this.isBatchProcessing = false
      this.activeBatchItemId = null
      if (this.batchCancelRequested) {
        // Items never reached stay "pending" forever otherwise,
        // which reads as "still queued" after a cancel.
        this.batchItems.forEach((entry) => {
          if (entry.status === "pending") {
            entry.status = "cancelled"
          }
        })
        this.progressTip = this.t("batch.cancelled")
      } else {
        let failedCount = this.batchItems.filter((entry) => entry.status === "error").length
        this.progressTip = this.t(failedCount ? "batch.doneWithErrors" : "batch.done", {
          done: this.batchDoneCount,
          total: this.batchItems.length,
          failed: failedCount
        })
        ElNotification({
          title: this.t("notify.success"),
          message: this.progressTip,
          type: failedCount ? "warning" : "success"
        })
      }
      this.uploadRef?.clearFiles()
    },

    getOutputFilename() {
      let filename = "realcugan-output"
      if (this.uploadPreviewName && this.uploadPreviewName.length > 0) {
        filename = this.uploadPreviewName.replace(/\.[^/.]+$/, "")
      }
      filename += "-" + this.outputModelType + "-up" + this.outputScale + "x"
      switch (this.outputDenoise) {
        case -1:
          filename += "-conservative.png"
          break
        case 1:
          filename += "-denoise1x.png"
          break
        case 2:
          filename += "-denoise2x.png"
          break
        case 3:
          filename += "-denoise3x.png"
          break
        default:
          filename += "-no-denoise.png"
      }
      return filename
    },

    rememberBatchResult(
      objectUrl: string,
      previewUrl: string,
      outputWidth: number,
      outputHeight: number
    ) {
      if (!this.isBatchActive || !this.activeBatchItemId || !objectUrl) {
        return
      }
      let item = this.batchItems.find((entry) => entry.id === this.activeBatchItemId)
      if (!item) {
        return
      }
      item.filename = this.getOutputFilename()
      if (item.objectUrl) URL.revokeObjectURL(item.objectUrl)
      if (item.outputPreviewObjectUrl) URL.revokeObjectURL(item.outputPreviewObjectUrl)
      item.outputPreviewObjectUrl = previewUrl
      item.objectUrl = objectUrl
      item.outputWidth = outputWidth || this.outputPreviewWidth
      item.outputHeight = outputHeight || this.outputPreviewHeight
      item.outputScale = this.outputScale
      item.outputDenoise = this.outputDenoise
      item.outputModelType = this.outputModelType
    },

    selectBatchItem(item: BatchItem) {
      if (!item || this.isBatchProcessing) {
        return
      }
      this.selectedBatchItemId = item.id
      if (!item.inputWidth || !item.inputHeight) {
        return
      }
      this.uploadPreviewName = item.name
      this.uploadPreviewWidth = item.inputWidth
      this.uploadPreviewHeight = item.inputHeight
      this.uploadImgSrc = item.previewObjectUrl || ""
      this.uploadObjectUrl = item.previewObjectUrl || ""
      this.inputBlob = item.file.raw || null
      this.outputScale = item.outputScale || this.scaleRadio
      // outputScale doubles as the "has a stored result" sentinel
      // (0 until processed): plain `||` would drop denoise 0 ("none")
      // and -1 ("conservative") for processed items.
      this.outputDenoise = item.outputScale ? item.outputDenoise : this.denoiseRadio
      this.outputModelType = item.outputModelType || this.modelTypeRadio
      this.outputPreviewWidth = item.outputWidth || item.inputWidth * this.outputScale
      this.outputPreviewHeight = item.outputHeight || item.inputHeight * this.outputScale
      this.outputImgSrc = item.outputPreviewObjectUrl || ""
      this.outputObjectUrl = item.objectUrl || ""
      this.isProcessDone = item.status === "done" && !!item.objectUrl
      this.isResultRevealing = false
      this.previewOverlapRate = 50
      this.previewZoom = this.previewZoomMin
      this.resetPreviewPan()
      this.scheduleStageLayoutSync()
      this.syncPreviewViewport()
    },

    downloadBatchItem(item: BatchItem) {
      if (!item || !item.objectUrl) {
        return
      }
      this.triggerDownload(item.objectUrl, item.filename)
    },

    // Re-run a single failed/cancelled batch item without redoing the
    // whole batch. Mirrors the per-item steps of runBatchQueue.
    async retryBatchItem(item: BatchItem) {
      if (!item || !item.file || this.isProcessing || this.isBatchProcessing) {
        return
      }
      this.isBatchProcessing = true
      this.batchCancelRequested = false
      this.activeBatchItemId = item.id
      this.selectedBatchItemId = item.id
      item.status = "processing"
      this.progressTip = this.t("batch.processing", {
        current: 1,
        total: 1,
        name: item.name
      })
      try {
        await this.loadImageFileToCanvas(item.file, item)
        item.inputWidth = this.uploadPreviewWidth
        item.inputHeight = this.uploadPreviewHeight
        this.scheduleStageLayoutSync()
        this.scrollStageIntoView()
        if (!item.file.raw) throw new Error("missing input file")
        await this.preflightProcess(item.file.raw, item.inputWidth, item.inputHeight)
        item.status = "done"
      } catch (error) {
        item.status = this.isCancelling || this.batchCancelRequested ? "cancelled" : "error"
        Logger.error("batch item retry failed:", item.name, error)
      } finally {
        this.isBatchProcessing = false
        this.activeBatchItemId = null
        this.progressTip = this.t("batch.done", {
          done: this.batchDoneCount,
          total: this.batchItems.length
        })
      }
    },

    async downloadAllBatchResults() {
      let items = this.batchItems.filter((item) => item.objectUrl)
      if (!items.length) {
        return
      }
      try {
        // One ZIP instead of N sequential a.click() downloads, which
        // Safari drops and Chrome gates behind a permission prompt.
        let entries = await Promise.all(
          items.map(async (item) => {
            let response = await fetch(item.objectUrl)
            return { name: item.filename, blob: await response.blob() }
          })
        )
        let zipBlob = await buildStoreZip(entries)
        let zipUrl = URL.createObjectURL(zipBlob)
        this.triggerDownload(zipUrl, "realcugan-batch.zip")
        setTimeout(() => URL.revokeObjectURL(zipUrl), 60000)
      } catch (error) {
        Logger.error("zip download failed, falling back to sequential:", error)
        items.forEach((item, index) => {
          setTimeout(() => this.downloadBatchItem(item), index * 300)
        })
      }
    },

    triggerDownload(objectUrl: string, filename: string) {
      var a = document.getElementById("download-link")
      if (!(a instanceof HTMLAnchorElement)) return
      a.href = objectUrl
      a.download = filename
      a.click()
    },

    getBatchTagType(status: string) {
      if (status === "done") {
        return "success"
      }
      if (status === "error") {
        return "danger"
      }
      if (status === "processing") {
        return "warning"
      }
      return "info"
    },

    getBatchItemStyle(): CSSProperties {
      return {
        width: "calc(100% - 2px)",
        maxWidth: "calc(100% - 2px)",
        boxSizing: "border-box",
        overflow: "hidden",
        marginRight: "0",
        flexShrink: "0"
      }
    },

    getBatchDownloadButtonStyle(item: BatchItem): CSSProperties & Record<`--${string}`, string> {
      let fallbackAccent = "var(--theme-primary)"
      let fallbackText = "var(--theme-on-primary)"
      if (!item || !item.accentColor) {
        return {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          minWidth: "28px",
          padding: "0",
          borderRadius: "50%",
          background: fallbackAccent,
          boxShadow: "none",
          color: fallbackText
        }
      }
      return {
        "--batch-download-accent": item.accentColor,
        "--batch-download-soft": item.accentSoftColor || item.accentColor,
        "--batch-download-on-accent": item.accentTextColor || "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        minWidth: "28px",
        padding: "0",
        borderRadius: "50%",
        borderColor: item.accentColor,
        background: item.accentColor,
        boxShadow: "none",
        color: item.accentTextColor || "#ffffff"
      }
    },

    applyBatchItemAccentFromCanvas(item: BatchItem, sourceCanvas: HTMLCanvasElement) {
      if (!item || !sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) {
        return
      }
      const sample = this.getCanvasThemeSample(sourceCanvas)
      const colors = this.extractThemeColors(sample.imageData, 1)
      sample.canvas.width = 0
      sample.canvas.height = 0
      const color = colors[0] || { r: 64, g: 158, b: 255 }
      const hsl = colord({ r: color.r, g: color.g, b: color.b }).toHsl()
      const accent = colord({
        h: hsl.h,
        s: this.clampColorValue(hsl.s, 46, 82),
        l: this.clampColorValue(hsl.l, 34, 56)
      }).toRgb()
      const soft = colord({
        h: hsl.h,
        s: this.clampColorValue(hsl.s, 28, 64),
        l: this.getEffectiveTheme() === "dark" ? 22 : 92
      }).toRgb()
      item.accentColor = this.rgbCss(accent)
      item.accentSoftColor = this.rgbCss(soft)
      item.accentTextColor = this.getReadableTextOnColor(accent)
    },

    applyImageThemeFromCanvas(sourceCanvas: HTMLCanvasElement) {
      const sample = this.getCanvasThemeSample(sourceCanvas)
      this.applyImageTheme(sample.imageData)
      sample.canvas.width = 0
      sample.canvas.height = 0
    },

    getCanvasThemeSample(sourceCanvas: HTMLCanvasElement) {
      const maxSampleSize = 96
      const scale = Math.min(1, maxSampleSize / Math.max(sourceCanvas.width, sourceCanvas.height))
      const sampleWidth = Math.max(1, Math.round(sourceCanvas.width * scale))
      const sampleHeight = Math.max(1, Math.round(sourceCanvas.height * scale))
      const sampleCanvas = document.createElement("canvas")
      sampleCanvas.width = sampleWidth
      sampleCanvas.height = sampleHeight
      const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true })
      if (!sampleContext) throw new Error("failed to get canvas context")
      sampleContext.drawImage(sourceCanvas, 0, 0, sampleWidth, sampleHeight)
      return {
        canvas: sampleCanvas,
        imageData: sampleContext.getImageData(0, 0, sampleWidth, sampleHeight)
      }
    },

    preflightProcess(sourceBlob: Blob, w: number, h: number): Promise<ProcessResult> {
      let risk = this.getProcessingRisk(w, h, this.scaleRadio)
      if (
        this.isBatchProcessing ||
        risk.level === "ok" ||
        this.getPreference("skipSizeRiskWarning") === "1"
      ) {
        return this.startProcessAndWait(sourceBlob, w, h)
      }
      let skipWarning = false
      return ElMessageBox.confirm(
        this.getSizeRiskMessageHtml(risk),
        this.t("dialog.sizeRiskTitle"),
        {
          confirmButtonText: this.t("dialog.safeSettings"),
          cancelButtonText: this.t("dialog.continue"),
          type: "warning",
          distinguishCancelAndClose: true,
          dangerouslyUseHTMLString: true,
          beforeClose: (action, instance, done) => {
            let checkbox = document.getElementById("size-risk-skip-checkbox")
            skipWarning = checkbox instanceof HTMLInputElement && checkbox.checked
            done()
          }
        }
      )
        .then(() => {
          if (skipWarning) {
            this.savePreference("skipSizeRiskWarning", "1")
          }
          this.applySafeProcessingSettings()
          return this.startProcessAndWait(sourceBlob, w, h)
        })
        .catch((action) => {
          if (skipWarning) {
            this.savePreference("skipSizeRiskWarning", "1")
          }
          if (action === "cancel") {
            return this.startProcessAndWait(sourceBlob, w, h)
          }
          throw new Error("processing cancelled before start")
        })
    },

    // Narrow-viewport check for UI behaviors only (popover placement,
    // scroll-into-view). Memory/runtime decisions use isMobileDevice()
    // instead; the CSS layout breakpoints are 1120/640 in app.css.
    isMobileViewport() {
      return this.windowWidth <= 768
    },

    isIOSDevice() {
      // iPadOS 13+ masquerades as MacIntel; distinguish via touch points.
      return (
        /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      )
    },

    isMobileDevice() {
      // Capability-based: viewport width misclassifies landscape phones and tablets.
      return this.isIOSDevice() || /Android|Mobile/i.test(navigator.userAgent)
    },

    getDeviceMemoryGiB(isMobileDevice: boolean) {
      let reported =
        Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) ||
        (isMobileDevice ? 4 : 8)
      let clamped = Math.max(2, Math.min(8, reported))
      // Safari never implements navigator.deviceMemory; without the clamp
      // iOS devices would default to 8 GiB and skip every memory warning.
      return this.isIOSDevice() ? Math.min(clamped, 4) : clamped
    },

    scrollStageIntoView() {
      if (!this.isMobileViewport()) {
        return
      }
      void this.$nextTick(() => {
        let stage = this.getRefElement("stagePanel")
        if (stage && stage.scrollIntoView) {
          stage.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }).catch((error: unknown) => Logger.error("Failed to scroll to stage:", error))
    },

    applySafeProcessingSettings() {
      this.modelTypeRadio = "se"
      this.scaleRadio = 2
      this.safeProcessingMode = true
      this.normalizeModelOptions()
      this.savePreference("modelType", this.modelTypeRadio)
      this.savePreference("scale", "" + this.scaleRadio)
      this.savePreference("denoise", "" + this.denoiseRadio)
    },

    escapeHtml(value: string) {
      return (value + "").replace(/[&<>"']/g, (char) => {
        return (
          {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
          } as Record<string, string>
        )[char]
      })
    },

    getSizeRiskMessageHtml(risk: {
      level: string
      width: number
      height: number
      memory: number
      mobile: boolean
    }) {
      let message =
        risk.level === "block"
          ? this.t("dialog.sizeRiskBlockText", risk)
          : this.t("dialog.sizeRiskText", risk)
      let skipHtml =
        '<label class="size-risk-skip"><input id="size-risk-skip-checkbox" type="checkbox"> ' +
        this.escapeHtml(this.t("dialog.dontShowAgain")) +
        "</label>"
      return (
        '<div class="size-risk-dialog-text">' +
        "<p>" +
        this.escapeHtml(message) +
        "</p>" +
        (risk.mobile ? "<p>" + this.escapeHtml(this.t("dialog.sizeRiskMobileHint")) + "</p>" : "") +
        "<p>" +
        this.escapeHtml(this.t("dialog.sizeRiskSafeText")) +
        "</p>" +
        skipHtml +
        "</div>"
      )
    },

    getProcessingRisk(w: number, h: number, scale: number) {
      let outputWidth = w * scale
      let outputHeight = h * scale
      let inputPixels = w * h
      let outputPixels = outputWidth * outputHeight
      let isMobileDevice = this.isMobileDevice()
      let gibibyte = 1024 * 1024 * 1024
      let measuredBackendWorkingSet = (scale === 4 ? 1150 : scale === 3 ? 1050 : 950) * 1024 * 1024
      let inputBytes = inputPixels * 4
      let outputBytes = outputPixels * 4
      let transparentAlphaAllowance = inputPixels
      let estimatedBytes =
        measuredBackendWorkingSet + inputBytes * 2 + outputBytes * 2 + transparentAlphaAllowance
      let deviceMemoryGiB = this.getDeviceMemoryGiB(isMobileDevice)
      let practicalBudgetBytes = deviceMemoryGiB * gibibyte * (isMobileDevice ? 0.24 : 0.3)
      let warnBytes = Math.min(
        (isMobileDevice ? 1200 : 1800) * 1024 * 1024,
        Math.max((isMobileDevice ? 700 : 1100) * 1024 * 1024, practicalBudgetBytes * 0.72)
      )
      let blockBytes = Math.min(
        (isMobileDevice ? 1600 : 2600) * 1024 * 1024,
        Math.max((isMobileDevice ? 1100 : 1700) * 1024 * 1024, practicalBudgetBytes)
      )
      let level = "ok"
      if (estimatedBytes >= blockBytes) {
        level = "block"
      } else if (estimatedBytes >= warnBytes) {
        level = "warn"
      } else if (isMobileDevice && scale >= 4 && deviceMemoryGiB <= 4) {
        level = "warn"
      }
      return {
        level: level,
        width: outputWidth,
        height: outputHeight,
        memory: Math.ceil(estimatedBytes / 1024 / 1024),
        mobile: isMobileDevice
      }
    },

    async process(sourceBlob: Blob, w: number, h: number) {
      const imageId = ++this.activeImageId
      const started = performance.now()
      this.progressTip = this.t("progress.starting")
      this.processFailureDialogOpen = false
      this.isProcessing = true
      this.isCancelling = false
      this.isProcessDone = false
      this.isResultRevealing = false
      this.previewOverlapRate = 50
      this.previewZoom = this.previewZoomMin
      this.resetPreviewPan()
      this.progressRate = 0
      this.procFinalCostSeconds = null
      this.outputScale = this.scaleRadio
      this.outputDenoise = this.denoiseRadio
      this.outputModelType = this.modelTypeRadio
      this.outputPreviewWidth = w * this.outputScale
      this.outputPreviewHeight = h * this.outputScale
      if (this.webReParallaxNodes) {
        this.webReParallaxNodes.forEach((node) => {
          node.style.transform = ""
        })
      }
      try {
        const noise = (
          {
            "-1": "conservative",
            0: "no-denoise",
            1: "denoise1x",
            2: "denoise2x",
            3: "denoise3x"
          } as Record<number, string>
        )[this.outputDenoise]
        const model = MODELS.find(
          (entry) =>
            entry.family === this.outputModelType &&
            entry.scale === this.outputScale &&
            entry.noise === noise
        )
        if (!model) throw new Error("model not found")
        if (imageId !== this.activeImageId || this.isCancelling)
          throw new DOMException("processing cancelled", "AbortError")
        const result = await this.imageProcessor.process(
          sourceBlob,
          { modelId: model.id, tileSize: 128, backend: this.backendMode },
          (progress) => {
            const percent = progress.total
              ? Math.round((progress.completed / progress.total) * 100)
              : 0
            if (progress.stage === "download" || progress.stage === "initialize") {
              this.startModelLoading(
                {
                  label: this.getModelDisplayName(
                    this.outputScale,
                    this.outputDenoise,
                    this.outputModelType
                  )
                },
                percent,
                progress.stage
              )
            } else {
              this.finishModelLoading()
              this.progressTip = this.t("progress.processing")
              this.progressRate = progress.stage === "encode" ? 100 : percent
            }
          }
        )
        if (imageId !== this.activeImageId || this.isCancelling)
          throw new DOMException("processing cancelled", "AbortError")
        await this.onProcessEnd(performance.now() - started, result, imageId)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") this.onProcessCancelled()
        else this.handleProcessFailure(error)
      }
    },

    getStageViewportSize() {
      void this.stageLayoutTick
      let layout = ADAPTIVE_LAYOUT
      if (this.uploadPreviewWidth && this.uploadPreviewHeight) {
        let size = this.getAdaptiveStageSurfaceSize(this.getCurrentStageKind())
        let paddingSize = this.isMobile ? 20 : layout.stagePadding * 2
        return {
          width: Math.max(layout.minPreviewWidth, size.width - paddingSize),
          height: Math.max(layout.minPreviewHeight, size.height - paddingSize)
        }
      }
      let stage = this.getStageSurfaceElement()
      if (stage) {
        let inset = layout.stagePadding * 2
        return {
          width: Math.max(layout.minPreviewWidth, stage.clientWidth - inset),
          height: Math.max(layout.minPreviewHeight, stage.clientHeight - inset)
        }
      }
      let gutter = this.windowWidth > 1180 ? layout.wideViewportGutter : layout.narrowViewportGutter
      return {
        width: Math.max(layout.minPreviewWidth, this.windowWidth - gutter),
        height: Math.max(
          layout.minPreviewHeight,
          this.windowHeight - layout.fallbackViewportHeightOffset
        )
      }
    },

    scheduleStageLayoutSync() {
      if (this.stageLayoutFrame) {
        cancelAnimationFrame(this.stageLayoutFrame)
      }
      this.stageLayoutFrame = requestAnimationFrame(() => {
        this.stageLayoutFrame = null
        this.stageLayoutTick += 1
        this.syncPreviewViewport()
      })
    },

    getCurrentStageKind() {
      if (this.isProcessDone) {
        return "result"
      }
      if (this.uploadPreviewWidth !== 0) {
        return "input"
      }
      return "empty"
    },

    getWorkspaceStyle(): CSSProperties {
      if (this.isMobile) {
        return {}
      }
      let controlWidth = ADAPTIVE_LAYOUT.controlPanelWidth
      let gap = ADAPTIVE_LAYOUT.panelGap
      let size = this.getAdaptiveStageSurfaceSize(this.getCurrentStageKind())
      return {
        width: Math.floor(controlWidth + gap + size.width) + "px",
        gridTemplateColumns: controlWidth + "px " + Math.floor(size.width) + "px",
        gap: gap + "px"
      }
    },

    getStageSurfaceClass(kind: string) {
      return "stage-surface-adaptive stage-surface-" + kind
    },

    getAdaptiveStageBounds() {
      void this.stageLayoutTick
      let layout = ADAPTIVE_LAYOUT
      let appMain = this.getRefElement("appMain")
      let controlPanel = this.getRefElement("controlPanel")
      let appMainRect = appMain ? appMain.getBoundingClientRect() : null
      let controlRect = controlPanel ? controlPanel.getBoundingClientRect() : null
      let toolbarHeight = layout.fallbackToolbarHeight
      let appMainHorizontalPadding = this.isMobile
        ? 28
        : this.windowWidth > layout.breakpoint
          ? layout.appMainDesktopPaddingX
          : layout.appMainCompactPaddingX
      let controlWidth = controlRect ? controlRect.width : layout.controlPanelWidth
      let workspaceLimit = Math.min(
        layout.maxWorkspaceWidth,
        this.windowWidth - appMainHorizontalPadding
      )

      let maxPanelHeight
      if (this.isMobile) {
        // Break circular layout loop by using windowHeight directly on mobile
        maxPanelHeight = Math.max(layout.minPanelHeight, this.windowHeight - 54 - 44 - 18)
      } else {
        maxPanelHeight = appMainRect
          ? Math.max(layout.minPanelHeight, appMainRect.height - layout.appMainDesktopPaddingX)
          : Math.max(layout.minPanelHeight, this.windowHeight - layout.appMainDesktopPaddingX * 2)
      }

      let maxBodyWidth = this.isMobile
        ? workspaceLimit
        : Math.max(layout.minBodyWidth, workspaceLimit - controlWidth - layout.panelGap)
      let maxBodyHeight = Math.max(layout.minBodyHeight, maxPanelHeight - toolbarHeight)
      let paddingSize = this.isMobile ? 20 : layout.stagePadding * 2
      return {
        minSurfaceWidth: layout.minPreviewWidth + paddingSize,
        minSurfaceHeight: layout.minPreviewHeight + paddingSize,
        maxSurfaceWidth: maxBodyWidth,
        maxSurfaceHeight: maxBodyHeight
      }
    },

    getAdaptiveStageSurfaceSize(kind: string) {
      let layout = ADAPTIVE_LAYOUT
      let bounds = this.getAdaptiveStageBounds()
      let paddingSize = this.isMobile ? 20 : layout.stagePadding * 2
      if (kind === "empty" || !this.uploadPreviewWidth || !this.uploadPreviewHeight) {
        return {
          width: Math.min(
            bounds.maxSurfaceWidth,
            (this.isMobile ? 320 : layout.emptyUploadWidth) + paddingSize
          ),
          height: Math.min(
            bounds.maxSurfaceHeight,
            (this.isMobile ? 240 : layout.emptyUploadHeight) + paddingSize
          )
        }
      }

      let targetScale = this.outputScale || this.scaleRadio
      let imageWidth = this.outputPreviewWidth || this.uploadPreviewWidth * targetScale
      let imageHeight = this.outputPreviewHeight || this.uploadPreviewHeight * targetScale
      let naturalWidth = imageWidth + paddingSize
      let naturalHeight = imageHeight + paddingSize
      let scale = Math.min(
        1,
        bounds.maxSurfaceWidth / Math.max(1, naturalWidth),
        bounds.maxSurfaceHeight / Math.max(1, naturalHeight)
      )
      let width = naturalWidth * scale
      let height = naturalHeight * scale
      if (width < bounds.minSurfaceWidth || height < bounds.minSurfaceHeight) {
        let minScale = Math.max(
          bounds.minSurfaceWidth / Math.max(1, width),
          bounds.minSurfaceHeight / Math.max(1, height)
        )
        width *= minScale
        height *= minScale
      }
      // Reachable for extreme aspect ratios: the min-scale bump above
      // can push the other axis back over its max bound.
      if (width > bounds.maxSurfaceWidth || height > bounds.maxSurfaceHeight) {
        let maxScale = Math.min(
          bounds.maxSurfaceWidth / Math.max(1, width),
          bounds.maxSurfaceHeight / Math.max(1, height)
        )
        width *= maxScale
        height *= maxScale
      }
      // Keep the floor from overflowing narrow viewports (320px-class
      // devices): the shell adds ~16px of horizontal padding.
      let minStageWidth = Math.min(layout.minStageWidth, Math.max(240, this.windowWidth - 24))
      return {
        width: Math.max(minStageWidth, Math.floor(width)),
        height: Math.max(layout.minBodyHeight, Math.floor(height))
      }
    },

    getStagePanelStyle(): CSSProperties {
      void this.stageLayoutTick
      let size = this.getAdaptiveStageSurfaceSize(this.getCurrentStageKind())
      return {
        width: Math.floor(size.width) + "px",
        height: Math.floor(size.height + ADAPTIVE_LAYOUT.stagePanelChromeHeight) + "px"
      }
    },

    getStageSurfaceStyle(kind: string): CSSProperties {
      void this.stageLayoutTick
      let size = this.getAdaptiveStageSurfaceSize(kind)
      return {
        width: Math.floor(size.width) + "px",
        height: Math.floor(size.height) + "px"
      }
    },

    getInputPreviewSize() {
      if (!this.uploadPreviewWidth || !this.uploadPreviewHeight) {
        return { width: 0, height: 0 }
      }
      let stageSize = this.getStageViewportSize()
      let maxWidth = stageSize.width
      let maxHeight = stageSize.height
      let ratio = Math.min(
        maxWidth / this.uploadPreviewWidth,
        maxHeight / this.uploadPreviewHeight,
        1
      )
      return {
        width: Math.max(1, Math.floor(this.uploadPreviewWidth * ratio)),
        height: Math.max(1, Math.floor(this.uploadPreviewHeight * ratio))
      }
    },

    getPreviewSize() {
      let stageSize = this.getStageViewportSize()
      let maxWidth = stageSize.width
      let maxHeight = this.getPreviewImageAreaHeight(stageSize.height)
      let originImgWidth = this.uploadPreviewWidth
      let originImgHeight = this.uploadPreviewHeight
      let outputImgWidth = this.outputPreviewWidth
      let outputImgHeight = this.outputPreviewHeight
      if (maxWidth < originImgWidth) {
        originImgWidth = maxWidth
        originImgHeight = originImgWidth * (this.uploadPreviewHeight / this.uploadPreviewWidth)
      }
      if (maxWidth < outputImgWidth) {
        outputImgWidth = maxWidth
        outputImgHeight = outputImgWidth * (this.outputPreviewHeight / this.outputPreviewWidth)
      }
      if (maxHeight < outputImgHeight) {
        outputImgHeight = maxHeight
        outputImgWidth = outputImgHeight * (this.outputPreviewWidth / this.outputPreviewHeight)
      }
      return {
        originImgWidth: originImgWidth,
        originImgHeight: originImgHeight,
        outputImgWidth: outputImgWidth,
        outputImgHeight: outputImgHeight
      }
    },

    getPreviewImageAreaHeight(viewportHeight: number) {
      return Math.max(
        ADAPTIVE_LAYOUT.minPreviewHeight,
        viewportHeight || this.previewViewportHeight || 0
      )
    },

    getZoomedPreviewSize() {
      let baseSize = this.getPreviewSize()
      let zoomRatio = this.previewZoom / 100
      return {
        originImgWidth: Math.max(1, Math.floor(baseSize.originImgWidth * zoomRatio)),
        originImgHeight: Math.max(1, Math.floor(baseSize.originImgHeight * zoomRatio)),
        outputImgWidth: Math.max(1, Math.floor(baseSize.outputImgWidth * zoomRatio)),
        outputImgHeight: Math.max(1, Math.floor(baseSize.outputImgHeight * zoomRatio))
      }
    },

    // These run in style bindings every frame during split/pan drags;
    // prefer the cached previewViewportWidth (kept fresh by
    // syncPreviewViewport) over live clientWidth, which forces layout
    // mid-render.
    getViewportWidthCached() {
      if (this.previewViewportWidth) {
        return this.previewViewportWidth
      }
      let viewport = this.getPreviewViewportElement()
      return viewport ? viewport.clientWidth : 0
    },

    getPreviewSplitViewportX() {
      let viewportWidth = this.getViewportWidthCached()
      return viewportWidth ? (viewportWidth * this.previewOverlapRate) / 100 : 0
    },

    getPreviewSplitLocalX() {
      let viewportWidth = this.getViewportWidthCached()
      if (!viewportWidth) {
        return 0
      }
      let size = this.zoomedPreviewSize
      let imageLeft = (viewportWidth - size.outputImgWidth) / 2 + this.previewPanX
      let splitX = this.getPreviewSplitViewportX() - imageLeft
      return Math.max(0, Math.min(size.outputImgWidth, splitX))
    },

    syncPreviewViewport() {
      void this.$nextTick(() => {
        let update = () => {
          let viewport = this.getPreviewViewportElement()
          if (viewport && viewport.clientWidth) {
            this.previewViewportWidth = viewport.clientWidth
            this.previewViewportHeight = viewport.clientHeight
            this.clampPreviewPan()
          }
        }
        update()
        requestAnimationFrame(() => {
          update()
          requestAnimationFrame(update)
        })
      }).catch((error: unknown) => Logger.error("Failed to synchronize preview viewport:", error))
    },

    zoomInPreview() {
      this.setPreviewZoom(this.previewZoom + this.previewZoomStep)
    },

    zoomOutPreview() {
      this.setPreviewZoom(this.previewZoom - this.previewZoomStep)
    },

    // focal (optional): viewport-relative point {x, y} measured from the
    // viewport center. The pan is adjusted so the image content under
    // that point stays put — cursor/pinch-anchored zoom. Without it,
    // zoom is about the center (toolbar buttons).
    setPreviewZoom(nextZoom: number, focal?: { x: number; y: number } | null) {
      let previousZoom = this.previewZoom
      // Keep fractional zoom internally — rounding here would swallow
      // small trackpad deltas (100 * 0.998 rounds straight back to
      // 100). The readout rounds at display time instead.
      this.previewZoom = Math.max(this.previewZoomMin, Math.min(this.previewZoomMax, nextZoom))
      if (focal && previousZoom > 0 && this.previewZoom !== previousZoom) {
        let ratio = this.previewZoom / previousZoom
        // Keep the image point under the focal fixed:
        // newPan = focal - (focal - oldPan) * ratio
        this.previewPanX = focal.x - (focal.x - this.previewPanX) * ratio
        this.previewPanY = focal.y - (focal.y - this.previewPanY) * ratio
      }
      void this.$nextTick(() => {
        this.clampPreviewPan()
      }).catch((error: unknown) => Logger.error("Failed to clamp preview pan:", error))
    },

    // Convert a client-coordinate event point into a viewport-center-
    // relative focal for setPreviewZoom.
    getZoomFocalPoint(clientX: number, clientY: number) {
      let viewport = this.getPreviewViewportElement()
      if (!viewport) {
        return null
      }
      let rect = viewport.getBoundingClientRect()
      return {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2
      }
    },

    // Image-viewer conventions: double-click toggles 100% <-> 200%
    // about the clicked point; the % readout resets zoom on click.
    onPreviewDoubleClick(event: MouseEvent) {
      let target = this.previewZoom > this.previewZoomMin ? this.previewZoomMin : 200
      this.setPreviewZoom(target, this.getZoomFocalPoint(event.clientX, event.clientY))
    },

    resetPreviewZoom() {
      this.setPreviewZoom(this.previewZoomMin)
      this.resetPreviewPan()
    },

    onPreviewWheel(event: WheelEvent) {
      // Continuous, delta-proportional zoom. A trackpad emits dozens
      // of small deltaY events per swipe — fixed 25% steps made each
      // one jump a whole notch, slamming to min/max instantly.
      // Mouse wheels emit large deltas (~100/notch) and land near the
      // old step size; deltaMode 1 (lines) is normalized to pixels.
      let deltaY = event.deltaY * (event.deltaMode === 1 ? 16 : 1)
      let factor = Math.exp(-deltaY * 0.0022)
      this.setPreviewZoom(
        this.previewZoom * factor,
        this.getZoomFocalPoint(event.clientX, event.clientY)
      )
    },

    resetPreviewPan() {
      this.previewDragging = false
      this.previewPanX = 0
      this.previewPanY = 0
    },

    getPreviewPanBounds() {
      // Cached viewport dims + cached zoomed size: this runs on every
      // pointermove during a pan drag.
      let viewportWidth = this.getViewportWidthCached()
      let viewportHeight = this.previewViewportHeight
      if (!viewportHeight) {
        let viewport = this.getPreviewViewportElement()
        viewportHeight = viewport ? viewport.clientHeight : 0
      }
      if (!viewportWidth || !viewportHeight) {
        return { maxX: 0, maxY: 0 }
      }
      let size = this.zoomedPreviewSize
      let imageAreaHeight = this.getPreviewImageAreaHeight(viewportHeight)
      return {
        maxX: Math.max(0, (size.outputImgWidth - viewportWidth) / 2),
        maxY: Math.max(0, (size.outputImgHeight - imageAreaHeight) / 2)
      }
    },

    clampPreviewPan() {
      let bounds = this.getPreviewPanBounds()
      this.previewPanX = Math.max(-bounds.maxX, Math.min(bounds.maxX, this.previewPanX))
      this.previewPanY = Math.max(-bounds.maxY, Math.min(bounds.maxY, this.previewPanY))
    },

    getPanEventPoint(event: MouseEvent | TouchEvent) {
      let point = "touches" in event ? event.touches[0] || event.changedTouches[0] : event
      return {
        x: point.clientX,
        y: point.clientY
      }
    },

    onSplitHandleKeydown(event: KeyboardEvent) {
      let step = event.shiftKey ? 10 : 2
      let delta = 0
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        delta = -step
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        delta = step
      } else if (event.key === "Home") {
        this.previewOverlapRate = 0
        event.preventDefault()
        return
      } else if (event.key === "End") {
        this.previewOverlapRate = 100
        event.preventDefault()
        return
      } else {
        return
      }
      this.previewOverlapRate = Math.max(0, Math.min(100, this.previewOverlapRate + delta))
      event.preventDefault()
    },

    startSplitDrag(event: MouseEvent | TouchEvent) {
      let point = this.getPanEventPoint(event)
      this.splitDragging = true
      this.splitDragStartX = point.x
      this.splitDragStartRate = this.previewOverlapRate

      const moveHandler = (e: MouseEvent | TouchEvent) => {
        if (!this.splitDragging) return
        let p = this.getPanEventPoint(e)
        let deltaX = p.x - this.splitDragStartX
        let viewport = this.getPreviewViewportElement()
        let viewportWidth = this.previewViewportWidth || (viewport ? viewport.clientWidth : 0)
        if (!viewportWidth) return
        let deltaRate = (deltaX / viewportWidth) * 100
        let nextRate = Math.max(0, Math.min(100, this.splitDragStartRate + deltaRate))
        this.previewOverlapRate = nextRate
      }

      const endHandler = () => {
        this.splitDragging = false
        document.removeEventListener("mousemove", moveHandler)
        document.removeEventListener("mouseup", endHandler)
        document.removeEventListener("touchmove", moveHandler)
        document.removeEventListener("touchend", endHandler)
        document.removeEventListener("touchcancel", endHandler)
      }

      document.addEventListener("mousemove", moveHandler)
      document.addEventListener("mouseup", endHandler)
      document.addEventListener("touchmove", moveHandler, { passive: false })
      document.addEventListener("touchend", endHandler)
      document.addEventListener("touchcancel", endHandler)
    },

    getTouchPinchDistance(event: TouchEvent) {
      let a = event.touches[0]
      let b = event.touches[1]
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    },

    startPreviewPan(event: MouseEvent | TouchEvent) {
      if (event.target instanceof Element && event.target.closest(".el-slider")) {
        return
      }
      if ("touches" in event && event.touches.length === 2) {
        // Two fingers: start a pinch zoom (works even at 100%).
        this.previewDragging = false
        this.previewPinchStartDistance = this.getTouchPinchDistance(event)
        this.previewPinchStartZoom = this.previewZoom
        event.preventDefault()
        return
      }
      if (this.previewZoom <= this.previewZoomMin) {
        return
      }
      let bounds = this.getPreviewPanBounds()
      if (bounds.maxX === 0 && bounds.maxY === 0) {
        return
      }
      let point = this.getPanEventPoint(event)
      // Grabbing mid-glide interrupts it — drag starts from the
      // current on-screen position, Apple-style interruptibility.
      this.cancelPanGlide()
      this.panVelocitySamples = []
      this.previewDragging = true
      this.previewDragStartX = point.x
      this.previewDragStartY = point.y
      this.previewDragOriginX = this.previewPanX
      this.previewDragOriginY = this.previewPanY
      event.preventDefault()
      if (!("touches" in event)) {
        // Mouse drags follow the pointer document-wide: with
        // element-bound listeners, the drag died the instant the
        // cursor left the viewport (mouseleave) — easy to hit on a
        // fast pan. Touch events keep firing on the start element,
        // so the template's touch bindings stay as they are.
        const moveHandler = (e: MouseEvent) => this.movePreviewPan(e)
        const upHandler = () => {
          this.endPreviewPan()
          document.removeEventListener("mousemove", moveHandler)
          document.removeEventListener("mouseup", upHandler)
        }
        document.addEventListener("mousemove", moveHandler)
        document.addEventListener("mouseup", upHandler)
      }
    },

    movePreviewPan(event: MouseEvent | TouchEvent) {
      if ("touches" in event && event.touches.length === 2 && this.previewPinchStartDistance) {
        let ratio = this.getTouchPinchDistance(event) / this.previewPinchStartDistance
        let midX = (event.touches[0].clientX + event.touches[1].clientX) / 2
        let midY = (event.touches[0].clientY + event.touches[1].clientY) / 2
        this.setPreviewZoom(
          Math.round(this.previewPinchStartZoom * ratio),
          this.getZoomFocalPoint(midX, midY)
        )
        event.preventDefault()
        return
      }
      if (!this.previewDragging) {
        return
      }
      let point = this.getPanEventPoint(event)
      this.previewPanX = this.previewDragOriginX + point.x - this.previewDragStartX
      this.previewPanY = this.previewDragOriginY + point.y - this.previewDragStartY
      this.clampPreviewPan()
      // Short position history for release velocity (momentum glide).
      let now = performance.now()
      this.panVelocitySamples.push({ x: point.x, y: point.y, t: now })
      if (this.panVelocitySamples.length > 5) {
        this.panVelocitySamples.shift()
      }
      event.preventDefault()
    },

    endPreviewPan(event?: TouchEvent | MouseEvent) {
      if (event && "touches" in event && event.touches.length >= 2) {
        return
      }
      let wasDragging = this.previewDragging
      this.previewDragging = false
      this.previewPinchStartDistance = 0
      if (wasDragging) {
        this.startPanGlide()
      }
      this.panVelocitySamples = []
    },

    // Momentum: project the release velocity with exponential decay
    // (Apple's deceleration model) and glide there, clamping at bounds.
    startPanGlide() {
      let samples = this.panVelocitySamples
      if (!samples || samples.length < 2) {
        return
      }
      let last = samples[samples.length - 1]
      let first = samples[0]
      let dt = last.t - first.t
      // Stale samples mean the pointer paused before release — no fling.
      if (dt <= 0 || performance.now() - last.t > 80) {
        return
      }
      let vx = (last.x - first.x) / dt // px per ms
      let vy = (last.y - first.y) / dt
      if (Math.hypot(vx, vy) < 0.25) {
        return
      }
      const DECAY = 0.95 // per frame @60fps
      let step = () => {
        if (this.previewDragging || !this.isProcessDone) {
          this.panGlideFrame = null
          return
        }
        this.previewPanX += vx * 16
        this.previewPanY += vy * 16
        let bounds = this.getPreviewPanBounds()
        // Kill the axis velocity on impact with a bound.
        if (this.previewPanX <= -bounds.maxX || this.previewPanX >= bounds.maxX) {
          vx = 0
        }
        if (this.previewPanY <= -bounds.maxY || this.previewPanY >= bounds.maxY) {
          vy = 0
        }
        this.clampPreviewPan()
        vx *= DECAY
        vy *= DECAY
        if (Math.hypot(vx, vy) > 0.02) {
          this.panGlideFrame = requestAnimationFrame(step)
        } else {
          this.panGlideFrame = null
        }
      }
      this.cancelPanGlide()
      this.panGlideFrame = requestAnimationFrame(step)
    },

    cancelPanGlide() {
      if (this.panGlideFrame) {
        cancelAnimationFrame(this.panGlideFrame)
        this.panGlideFrame = null
      }
    },

    hasStableWasmProgress() {
      return this.wasmLoadingProgress >= 10
    },

    getWasmLoadingText() {
      if (!this.hasStableWasmProgress()) {
        return this.t("stage.preparingBackend")
      }
      return this.t("stage.loadingAssetsProgress", { percent: this.wasmLoadingProgress })
    },

    async onProcessEnd(cost: number, blob: Blob, imageId: number) {
      const preview = await this.imageProcessor.preview(blob)
      if (imageId !== this.activeImageId || this.isCancelling)
        throw new DOMException("processing cancelled", "AbortError")
      const url = URL.createObjectURL(blob)
      const previewUrl = URL.createObjectURL(preview.blob)
      this.outputPreviewWidth = preview.width
      this.outputPreviewHeight = preview.height
      this.clearOutputPreviewUrl()
      this.outputObjectUrl = url
      this.outputImgSrc = previewUrl
      this.rememberBatchResult(url, previewUrl, preview.width, preview.height)
      this.finishModelLoading()
      this.isCancelling = false
      const costNum = cost < 1000 ? (cost / 1000).toFixed(2) : Math.round(cost / 1000)
      this.procFinalCostSeconds = costNum
      this.progressTip = this.t("progress.done", { seconds: costNum })
      this.isProcessing = false
      this.isProcessDone = true
      this.safeProcessingMode = false
      this.scheduleStageLayoutSync()
      this.beginResultReveal()
      this.syncPreviewViewport()
      this.scrollStageIntoView()
      this.resolveCurrentProcess({
        filename: this.getOutputFilename(),
        objectUrl: url,
        width: preview.width,
        height: preview.height
      })
      await this.$nextTick(() =>
        ElNotification({
          title: this.t("notify.success"),
          message: this.progressTip,
          type: "success"
        })
      )
    },

    clearOutputPreviewUrl() {
      if (this.outputObjectUrl && !this.isBatchManagedObjectUrl(this.outputObjectUrl)) {
        URL.revokeObjectURL(this.outputObjectUrl)
      }
      if (this.outputImgSrc && !this.isBatchManagedObjectUrl(this.outputImgSrc)) {
        URL.revokeObjectURL(this.outputImgSrc)
      }
      this.outputObjectUrl = ""
      this.outputImgSrc = ""
    },

    clearUploadPreviewUrl() {
      if (this.uploadObjectUrl) {
        if (!this.isBatchManagedObjectUrl(this.uploadObjectUrl)) {
          URL.revokeObjectURL(this.uploadObjectUrl)
        }
        this.uploadObjectUrl = ""
      }
      this.uploadImgSrc = ""
    },

    isBatchManagedObjectUrl(objectUrl: string) {
      if (!objectUrl || !this.batchItems || !this.batchItems.length) {
        return false
      }
      return this.batchItems.some((item) => {
        return (
          item.previewObjectUrl === objectUrl ||
          item.outputPreviewObjectUrl === objectUrl ||
          item.objectUrl === objectUrl
        )
      })
    },

    beginResultReveal() {
      if (this.resultRevealTimer) {
        clearTimeout(this.resultRevealTimer)
        this.resultRevealTimer = null
      }
      this.isResultRevealing = true
      this.startRevealWipeSweep()
      this.resultRevealTimer = setTimeout(() => {
        this.isResultRevealing = false
        this.resultRevealTimer = null
      }, 1900)
    },

    // The reveal moment: sweep the compare split 0 -> 100 -> 50 so the
    // first thing the user sees is the result literally wiping across
    // the original — the product's core value made visible. Respects
    // reduced motion, and any user drag on the handle cancels it.
    startRevealWipeSweep() {
      this.cancelRevealWipeSweep()
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return
      }
      let start: number | null = null
      const DURATION = 1500
      let step = (now: number) => {
        if (this.splitDragging || !this.isProcessDone) {
          // User grabbed the handle (or state changed) — hand over control.
          this.revealWipeFrame = null
          return
        }
        if (start === null) {
          start = now
        }
        let t = Math.min(1, (now - start) / DURATION)
        // Ease-in-out; phase 1 (0-0.62): 0 -> 100, phase 2: 100 -> 50.
        let eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        this.previewOverlapRate =
          eased < 0.62 ? (eased / 0.62) * 100 : 100 - ((eased - 0.62) / 0.38) * 50
        if (t < 1) {
          this.revealWipeFrame = requestAnimationFrame(step)
        } else {
          this.previewOverlapRate = 50
          this.revealWipeFrame = null
        }
      }
      this.previewOverlapRate = 0
      this.revealWipeFrame = requestAnimationFrame(step)
    },

    cancelRevealWipeSweep() {
      if (this.revealWipeFrame) {
        cancelAnimationFrame(this.revealWipeFrame)
        this.revealWipeFrame = null
      }
    },

    clearResultReveal() {
      if (this.resultRevealTimer) {
        clearTimeout(this.resultRevealTimer)
        this.resultRevealTimer = null
      }
      this.cancelRevealWipeSweep()
      this.isResultRevealing = false
    },

    restoreAfterProcessFailure() {
      this.clearResultReveal()
      this.isProcessing = false
      this.isCancelling = false
      this.isProcessDone = false
      this.progressRate = 0
      this.procFinalCostSeconds = null
      this.progressTip = ""
      this.safeProcessingMode = false
      this.finishModelLoading()
      this.clearOutputPreviewUrl()
      this.outputPreviewWidth = 0
      this.outputPreviewHeight = 0
    },

    mapProcessErrorKey(code: number, lowerText: string) {
      if (lowerText.includes("webgpu")) return "processErrorWebgpu"
      if (lowerText.includes("memory")) return "processErrorMemory"
      if (lowerText.includes("model")) return "processErrorModel"
      if (lowerText.includes("not found") || lowerText.includes("worker"))
        return "processErrorAsset"
      return "processErrorGeneric"
    },

    getActionableProcessError(error: unknown) {
      let raw =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message
          ? error.message
          : String(error)
      return {
        raw: raw,
        message: this.t("dialog." + this.mapProcessErrorKey(NaN, raw.toLowerCase()))
      }
    },

    handleProcessFailure(error: unknown) {
      let mapped =
        typeof error === "object" &&
        error !== null &&
        "isMappedBackendError" in error &&
        error.isMappedBackendError &&
        "message" in error &&
        typeof error.message === "string"
          ? { message: error.message, raw: "" }
          : this.getActionableProcessError(error)
      this.restoreAfterProcessFailure()
      this.rejectCurrentProcess(error)
      if (this.isBatchProcessing) {
        // No modal mid-batch: the item's red error tag and the final
        // summary already tell the story; a dialog per failed image
        // would make the user babysit the queue.
        return
      }
      if (this.processFailureDialogOpen) {
        return
      }
      this.processFailureDialogOpen = true
      let detail = mapped.raw ? mapped.message + "\n\n" + mapped.raw : mapped.message
      void ElMessageBox.alert(
        this.t("dialog.processErrorText", { message: detail }),
        this.t("dialog.processErrorTitle"),
        {
          confirmButtonText: this.t("dialog.ok"),
          callback: () => {
            this.processFailureDialogOpen = false
          }
        }
      ).catch((reason: unknown) => {
        if (reason !== "cancel" && reason !== "close")
          Logger.error("Failed to show process error:", reason)
      })
    },

    saveOutput() {
      if (!this.outputObjectUrl) {
        this.handleProcessFailure("missing output download blob")
        return
      }
      let filename = this.getOutputFilename()
      this.triggerDownload(this.outputObjectUrl, filename)
      ElNotification({
        title: this.t("notify.saved"),
        message: filename,
        type: "success"
      })
    },

    stopProcess() {
      if (!this.isProcessing || this.isCancelling) {
        return
      }
      this.isCancelling = true
      if (this.isBatchProcessing) {
        this.batchCancelRequested = true
      }
      this.progressTip = this.t("progress.cancelling")
      this.imageProcessor.cancel()
    },

    onProcessCancelled() {
      this.rejectCurrentProcess(new Error("processing cancelled"))
      this.resetWorkspace({ keepBatch: this.isBatchActive })
    },

    resetWorkspace(options: { keepBatch?: boolean } = {}) {
      this.activeImageId += 1
      this.inputBlob = null
      this.finishModelLoading()
      this.clearResultReveal()
      this.clearUploadPreviewUrl()
      this.uploadPreviewWidth = 0
      this.uploadPreviewHeight = 0
      this.uploadPreviewName = ""
      this.clearOutputPreviewUrl()
      this.outputPreviewWidth = 0
      this.outputPreviewHeight = 0
      this.outputScale = 0
      this.outputDenoise = 0
      this.outputModelType = "se"
      this.isProcessing = false
      this.isCancelling = false
      this.isProcessDone = false
      this.isResultRevealing = false
      this.progressRate = 0
      this.procFinalCostSeconds = null
      this.progressTip = ""
      this.designDots = []
      this.processFailureDialogOpen = false
      this.safeProcessingMode = false
      this.activeBatchItemId = null
      if (!options.keepBatch) {
        this.batchCancelRequested = false
        this.clearBatchResults()
        this.isBatchActive = false
        this.isBatchProcessing = false
        this.batchItems = []
        this.selectedBatchItemId = null
        this.batchRunId += 1
      }
      this.previewOverlapRate = 50
      this.previewZoom = this.previewZoomMin
      this.previewViewportWidth = 0
      this.previewViewportHeight = 0
      this.resetPreviewPan()
      this.resetTheme()
      this.scheduleStageLayoutSync()
      let uploadCanvas = document.getElementById("canvas-upload")
      if (uploadCanvas instanceof HTMLCanvasElement) {
        uploadCanvas.width = 0
        uploadCanvas.height = 0
      }
    },

    clearBatchResults() {
      this.batchItems.forEach((item) => {
        if (item.previewObjectUrl) {
          URL.revokeObjectURL(item.previewObjectUrl)
        }
        if (item.outputPreviewObjectUrl) {
          URL.revokeObjectURL(item.outputPreviewObjectUrl)
        }
        if (item.objectUrl) {
          URL.revokeObjectURL(item.objectUrl)
        }
      })
    },

    async runTestCase() {
      await this.loadTestCase()
    },

    async loadTestCase() {
      try {
        const response = await fetch("test-img.png")
        if (!response.ok) throw new Error("failed to load test image")
        this.readUploadedFile({ name: "test-img.png", raw: await response.blob() })
      } catch (error) {
        this.handleProcessFailure(error)
      }
    }
  }
})

export type Workspace = InstanceType<typeof WorkspaceController>
export default WorkspaceController
