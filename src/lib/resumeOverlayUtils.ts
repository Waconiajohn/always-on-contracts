// src/lib/resumeOverlayUtils.ts
import type { VaultOverlayState } from "@/lib/resumeVaultOverlay";
import type { ResumeSection } from "@/stores/resumeBuilderStore";

interface ResumeContentItem {
  id: string;
  content: string;
  source?: "user" | "overlay";
  requirementId?: string;
}

/**
 * Decide which section type a given overlay item should go into.
 */
function getPreferredSectionTypeForOverlayItem(payload: any): string {
  const type = payload?.type || "impact_statement";

  if (type === "impact_statement") return "experience";
  if (type === "transferable_skill") return "skills";
  if (type === "education") return "education";

  // Fallback: send to achievements / summary style section
  return "achievements";
}

/**
 * Try to find the best matching section by type or title.
 */
function findTargetSection(
  sections: ResumeSection[],
  preferredType: string
): ResumeSection | null {
  // 1) Exact type match
  let target =
    sections.find(
      (s) =>
        s.type?.toLowerCase() === preferredType.toLowerCase()
    ) || null;

  if (target) return target;

  // 2) Title contains the preferred type (e.g., "Professional Experience")
  target =
    sections.find((s) =>
      (s.title || "")
        .toLowerCase()
        .includes(preferredType.toLowerCase())
    ) || null;

  if (target) return target;

  // 3) Fallbacks for common types
  if (preferredType === "experience" || preferredType === "achievements") {
    return (
      sections.find((s) =>
        (s.title || "").toLowerCase().includes("experience")
      ) ||
      sections.find((s) =>
        (s.title || "").toLowerCase().includes("achievements")
      ) ||
      null
    );
  }

  if (preferredType === "skills") {
    return (
      sections.find(
        (s) => s.type?.toLowerCase() === "skills"
      ) ||
      sections.find((s) =>
        (s.title || "").toLowerCase().includes("skills")
      ) ||
      null
    );
  }

  return null;
}

/**
 * Injects overlay items with status `used_in_resume` into the resume sections.
 * This does NOT modify the original array; it returns a new one.
 */
export function injectOverlayIntoResumeSections(
  sections: ResumeSection[],
  overlay: VaultOverlayState | undefined | null
): ResumeSection[] {
  if (!overlay) return sections;

  const usedItems = (overlay.resumeOnlyItems || []).filter(
    (item) => item.status === "used_in_resume"
  );

  if (!usedItems.length) return sections;

  // Clone sections so we don't mutate original state
  const clonedSections: ResumeSection[] = sections.map((s) => ({
    ...s,
    content: Array.isArray(s.content) ? [...s.content] : [],
  }));

  for (const overlayItem of usedItems) {
    const payload: any = overlayItem.payload || {};
    const text = payload.text || "";
    if (!text.trim()) continue;

    const preferredType = getPreferredSectionTypeForOverlayItem(payload);
    let targetSection = findTargetSection(clonedSections, preferredType);

    // If we truly have no good target, append to the first section as a fallback
    if (!targetSection && clonedSections.length > 0) {
      targetSection = clonedSections[0];
    }

    if (!targetSection) continue;

    const item: ResumeContentItem = {
      id: overlayItem.id,
      content: text.trim(),
      source: "overlay",
      requirementId: overlayItem.requirementId,
    };

    // Mark overlay-derived content clearly but subtly
    const decoratedContent = item.requirementId
      ? `${item.content}  (aligned to: ${item.requirementId})`
      : item.content;

    (targetSection.content as any[]).push({
      id: item.id,
      content: decoratedContent,
      source: item.source,
    });
  }

  return clonedSections;
}
