import { api } from '../services/api';
import { isMindStudioElement } from './dom';

/**
 * Utilities for interacting with the current web page.
 * These utilities only work in the content script context.
 */
export const page = {
  /**
   * The way chrome renders PDFs makes them impossible to grab content inside,
   * because they're actually rendering in a separate private extension. So
   * if the current page is a PDF, we call fetch('') on the current URL and get
   * the PDF as a blob, upload it to MindStudio, and then pass that URL (in case
   * the URL is not publicly accessible) to MindStudio
   */
  async getRehostedPdfSecurePath(): Promise<string> {
    const request = await fetch('');
    const blob = await request.blob();

    // Get a signed upload URL
    const { fields, path, url } = await api.getSignedUploadUrl();

    const data = new FormData();
    Object.keys(fields).forEach((key) => {
      data.append(key, fields[key]);
    });
    data.append('file', blob);

    await api.uploadFile(url, data);

    return path;
  },

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

  /**
   * Get a metadata bundle for the page, including open graph tags, icons, etc.
   */
  getMetadataBundle(): string {
    const getMetaContent = (property: string, attr: string = 'property') => {
      const tag = [...document.getElementsByTagName('meta')].find(
        (meta) => meta.getAttribute(attr) === property,
      );
      return tag ? tag.content : null;
    };

    const getAllOpenGraphTags = () => {
      return [...document.getElementsByTagName('meta')]
        .filter((meta) => meta.getAttribute('property')?.startsWith('og:'))
        .reduce((acc: { [index: string]: string }, meta) => {
          const property = meta.getAttribute('property');
          if (property) {
            acc[property] = meta.content;
          }
          return acc;
        }, {});
    };

    const getBestFavicon = () => {
      const favicons = [...document.getElementsByTagName('link')].filter(
        (link) =>
          link.getAttribute('rel') &&
          link.getAttribute('rel')?.includes('icon'),
      );

      // Sort favicons by size (largest first)
      favicons.sort((a, b) => {
        const sizeA = parseInt(a.getAttribute('sizes')?.split('x')[0] || '0');
        const sizeB = parseInt(b.getAttribute('sizes')?.split('x')[0] || '0');
        return sizeB - sizeA;
      });

      return favicons.length > 0 ? favicons[0].href : null; // Fallback
    };

    const pageMetadata = {
      title: getMetaContent('og:title') || document.title,
      description:
        getMetaContent('og:description') ||
        getMetaContent('description', 'name') ||
        '',
      openGraphImage: getMetaContent('og:image') || '',
      openGraphTags: getAllOpenGraphTags(),
      favicon: getBestFavicon(),
    };

    return JSON.stringify(pageMetadata, null, 2);
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
      if (
        !['href', 'src', 'alt', 'title', 'srcset', 'alt'].includes(attr.name)
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }

  // Recursively clean child nodes
  for (const child of [...node.childNodes]) {
    cleanNode(child);
  }
}
