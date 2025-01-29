import { MINDSTUDIO_ID_PREFIX } from '../constants';

/**
 * Creates a MindStudio element ID with the standard prefix
 * @param id The unique identifier for the element
 * @returns A prefixed element ID
 */
export function createElementId(id: string): string {
  return `${MINDSTUDIO_ID_PREFIX}${id}`;
}

/**
 * Checks if an element ID belongs to MindStudio
 * @param id The element ID to check
 * @returns True if the ID starts with the MindStudio prefix
 */
export function isMindStudioElement(id: string | null): boolean {
  if (!id) {
    return false;
  }
  return id.startsWith(MINDSTUDIO_ID_PREFIX);
}
