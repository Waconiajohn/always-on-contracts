// src/lib/resumeVaultOverlay.ts

export type VaultSourceTag = "career_vault" | "job_gap" | "benchmark" | "manual";

export interface VaultOverlayItem<T = any> {
  id: string;
  /**
   * The raw content (impact statement, skill, leadership trait, etc.)
   */
  payload: T;
  /**
   * Where this came from – permanent vault, a specific job analysis, benchmarks, etc.
   */
  source: VaultSourceTag;
  /**
   * Whether the user has:
   * - explicitly approved this for THIS resume only
   * - promoted it into the Career Vault
   * - rejected it
   */
  status: "suggested" | "used_in_resume" | "promoted_to_vault" | "rejected";
  /**
   * Optional: which requirement / skill gap this was tied to.
   */
  requirementId?: string;
  /**
   * Optional free-form notes (e.g., "refined from user answer on 2025-11-15").
   */
  note?: string;
}

export interface VaultOverlayState {
  /**
   * Items that are ONLY used in the current resume build.
   * These never touch the permanent vault unless explicitly promoted.
   */
  resumeOnlyItems: VaultOverlayItem[];
  /**
   * Items that have been explicitly queued for promotion to the Career Vault,
   * but not yet persisted.
   */
  pendingVaultPromotions: VaultOverlayItem[];
}

export function createEmptyVaultOverlay(): VaultOverlayState {
  return {
    resumeOnlyItems: [],
    pendingVaultPromotions: [],
  };
}

/**
 * Add a new suggested item from job gap / benchmark analysis.
 * It starts as `suggested` and `source = "job_gap"` unless overridden.
 */
export function addSuggestedOverlayItem(
  overlay: VaultOverlayState,
  payload: any,
  meta?: Partial<Omit<VaultOverlayItem, "id" | "payload">>
): VaultOverlayState {
  const item: VaultOverlayItem = {
    id: crypto.randomUUID(),
    payload,
    source: meta?.source ?? "job_gap",
    status: "suggested",
    requirementId: meta?.requirementId,
    note: meta?.note,
  };

  return {
    ...overlay,
    resumeOnlyItems: [...overlay.resumeOnlyItems, item],
  };
}

/**
 * Mark a suggestion as "use in this resume only".
 */
export function markOverlayItemUsedInResume(
  overlay: VaultOverlayState,
  itemId: string
): VaultOverlayState {
  return {
    ...overlay,
    resumeOnlyItems: overlay.resumeOnlyItems.map((item) =>
      item.id === itemId ? { ...item, status: "used_in_resume" } : item
    ),
  };
}

/**
 * Queue a suggestion to be promoted into the Career Vault.
 */
export function markOverlayItemForPromotion(
  overlay: VaultOverlayState,
  itemId: string
): VaultOverlayState {
  const item = overlay.resumeOnlyItems.find((i) => i.id === itemId);
  if (!item) return overlay;

  const updated = { ...item, status: "promoted_to_vault" as const };

  return {
    ...overlay,
    resumeOnlyItems: overlay.resumeOnlyItems.map((i) =>
      i.id === itemId ? updated : i
    ),
    pendingVaultPromotions: [
      ...overlay.pendingVaultPromotions.filter((i) => i.id !== itemId),
      updated,
    ],
  };
}

/**
 * Reject a suggestion so it doesn't keep popping up.
 */
export function rejectOverlayItem(
  overlay: VaultOverlayState,
  itemId: string
): VaultOverlayState {
  return {
    ...overlay,
    resumeOnlyItems: overlay.resumeOnlyItems.map((item) =>
      item.id === itemId ? { ...item, status: "rejected" } : item
    ),
  };
}
