import type { HTMLAttributes } from "vue"

declare module "vue" {
  interface ComponentCustomProps {
    "aria-label"?: HTMLAttributes["aria-label"]
    title?: HTMLAttributes["title"]
  }
}
