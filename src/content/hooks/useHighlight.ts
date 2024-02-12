import { useEffect } from "react";

const activeButtons: HTMLButtonElement[] = [];

const useHighlight = (onChoose: (text: string) => void) => {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!window) {
        return;
      }

      const selection = window.getSelection();

      if (!selection || selection.isCollapsed) {
        return;
      }

      // Hide all active buttons if clicked outside the target
      if (activeButtons.length > 0) {
        activeButtons.forEach((button) => {
          if (event.target !== button) {
            button.remove();
          }
        });
      }

      const selectedText = selection.toString();

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Create Mindstudio button
      const button = document.createElement("button");
      button.className = "mindstudio-trigger";
      button.innerText = "Mindstudio";
      button.style.position = "absolute";
      button.style.top = rect.top - 30 + "px";
      button.style.left = rect.left + "px";
      button.style.zIndex = "9999";

      button.addEventListener("click", () => {
        onChoose(selectedText);
      });

      document.body.appendChild(button);

      activeButtons.push(button);
    };

    document.addEventListener("mouseup", handler);

    return () => {
      document.removeEventListener("mouseup", handler);
    };
  }, []);
};

export default useHighlight;
