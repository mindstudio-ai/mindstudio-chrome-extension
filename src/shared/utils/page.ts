import { isMindStudioElement } from './dom';

/**
 * Utilities for interacting with the current web page.
 * These utilities only work in the content script context.
 */
export const page = {
  /**
   * Gets the currently selected content from the page.
   * Works with both text selections and input fields.
   */
  getSelectedContent(): string | null {
    try {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) {
        return null;
      }

      // Check if the selection is in a text field
      const activeElement = document.activeElement as HTMLInputElement;
      if (
        activeElement &&
        (activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'INPUT')
      ) {
        const { selectionStart, selectionEnd, value } = activeElement;
        return value.substring(selectionStart ?? 0, selectionEnd ?? 0);
      }

      // Otherwise, return the selected HTML
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      return container.innerHTML;
    } catch {
      return null;
    }
  },

  /**
   * Returns a cleaned version of the page's DOM,
   * removing scripts and unnecessary attributes.
   */
  cleanDOM(): string {
    const clone = document.body.cloneNode(true) as HTMLElement;
    cleanNode(clone);
    return clone.innerHTML;
  },

  /**
   * Gets a cleaned version of the page's text content.
   */
  getCleanTextContent(): string {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNode(document.body);
      selection.removeAllRanges();
      selection.addRange(range);

      const text = selection.toString(); // Extract the text
      selection.removeAllRanges(); // Deselect after copying

      return text;
    }

    // Fallback to getting the document body
    const clone = document.body.cloneNode(true) as HTMLElement;
    cleanNode(clone);
    return clone.innerText;
  },
};

// Private helper
function cleanNode(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;

    // Remove MindStudio elements
    if (isMindStudioElement(el.id)) {
      el.remove();
      return;
    }

    const tagsToRemove = ['script', 'iframe', 'svg'];
    if (tagsToRemove.includes(el.tagName.toLowerCase())) {
      el.remove();
      return;
    }
    // Remove all non-essential attributes
    for (const attr of [...el.attributes]) {
      if (!['href', 'src', 'alt', 'title'].includes(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }
  }

  // Recursively clean child nodes
  for (const child of [...node.childNodes]) {
    cleanNode(child);
  }
}
