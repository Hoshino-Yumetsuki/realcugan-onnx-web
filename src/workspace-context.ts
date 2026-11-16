import { inject } from "vue"
import type { Workspace } from "./workspace"

export const WORKSPACE_KEY = Symbol("workspace")

export function useWorkspace(): Workspace {
  const workspace = inject<Workspace>(WORKSPACE_KEY)
  if (!workspace) throw new Error("Workspace was not provided")
  return workspace
}
