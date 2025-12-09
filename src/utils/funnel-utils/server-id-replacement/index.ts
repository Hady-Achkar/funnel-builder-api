/**
 * Server ID Replacement Utility
 *
 * Handles replacement of serverId references in page content when duplicating funnels.
 * Elements like forms, quizzes, and choice components have serverId fields that reference
 * database records (Form or Insight tables). When duplicating a funnel, new Form/Insight
 * records are created and the serverIds in page content must be updated to reference
 * the new records.
 */

export interface ServerIdMap {
  forms: Map<number, number>;
  insights: Map<number, number>;
}

interface ContentElement {
  id?: string;
  type?: string;
  serverId?: number;
  children?: ContentElement[];
  [key: string]: unknown;
}

// Element types that reference Form table
const FORM_ELEMENT_TYPES = ["form"];

// Element types that reference Insight table
const INSIGHT_ELEMENT_TYPES = ["quiz", "multiple-choice", "single-choice"];

/**
 * Replaces serverId references in page content JSON string
 */
export function replaceServerIdsInContent(
  content: string | null,
  serverIdMap: ServerIdMap
): string | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as ContentElement[];

    if (!Array.isArray(parsed)) {
      return content;
    }

    const updated = replaceServerIdsRecursive(parsed, serverIdMap);
    return JSON.stringify(updated);
  } catch {
    return content;
  }
}

/**
 * Recursively processes elements and replaces serverId references
 */
function replaceServerIdsRecursive(
  elements: ContentElement[],
  serverIdMap: ServerIdMap
): ContentElement[] {
  return elements.map((element) => {
    const updated = { ...element };

    // Check if element has serverId and type
    if (
      typeof updated.serverId === "number" &&
      typeof updated.type === "string"
    ) {
      if (FORM_ELEMENT_TYPES.includes(updated.type)) {
        const newId = serverIdMap.forms.get(updated.serverId);
        if (newId !== undefined) {
          updated.serverId = newId;
        }
      } else if (INSIGHT_ELEMENT_TYPES.includes(updated.type)) {
        const newId = serverIdMap.insights.get(updated.serverId);
        if (newId !== undefined) {
          updated.serverId = newId;
        }
      }
    }

    // Recursively process children
    if (Array.isArray(updated.children)) {
      updated.children = replaceServerIdsRecursive(
        updated.children,
        serverIdMap
      );
    }

    return updated;
  });
}
