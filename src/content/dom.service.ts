export class DOMService {
  private static instance: DOMService;

  private constructor() {}

  static getInstance(): DOMService {
    if (!DOMService.instance) {
      DOMService.instance = new DOMService();
    }
    return DOMService.instance;
  }

  cleanDOM(): string {
    const clone = document.body.cloneNode(true) as HTMLElement;
    this.cleanNode(clone);
    return clone.innerHTML;
  }

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
  }

  private cleanNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
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
      this.cleanNode(child);
    }
  }
}
