export class FloatingButtonService {
  private static instance: FloatingButtonService;
  private readonly buttonId = '__MindStudioFloatingButton';

  private constructor() {}

  static getInstance(): FloatingButtonService {
    if (!FloatingButtonService.instance) {
      FloatingButtonService.instance = new FloatingButtonService();
    }
    return FloatingButtonService.instance;
  }

  injectButton(): void {
    if (document.getElementById(this.buttonId)) {
      return;
    }

    const button = document.createElement('div');
    button.id = this.buttonId;
    button.innerHTML = `<img src="${chrome.runtime.getURL(
      'images/floating-button.png',
    )}" alt="MindStudio" style="width: 100%; height: 100%; object-fit: contain;" />`;

    button.style.cssText = `
      position: fixed;
      bottom: 128px;
      right: 0px;
      width: 48px;
      height: 40px;
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.2s ease;
      border-radius: 50%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    button.addEventListener('mouseover', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseout', () => {
      button.style.transform = 'scale(1)';
    });

    document.body.appendChild(button);
  }

  hideButton(): void {
    const button = document.getElementById(this.buttonId);
    if (button) {
      button.style.display = 'none';
    }
  }

  showButton(): void {
    const button = document.getElementById(this.buttonId);
    if (button) {
      button.style.display = 'flex';
    }
  }
}
