export class CollapseButton {
  private button: HTMLElement;

  constructor(onClickHandler: () => void) {
    this.button = this.createButton(onClickHandler);
  }

  private createButton(onClickHandler: () => void): HTMLElement {
    const button = document.createElement('button');
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #FEFEFE;
      opacity: 0;
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: auto;
      z-index: 2;
      box-sizing: content-box;
    `;

    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="#99999A" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#12121310';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });

    button.addEventListener('click', onClickHandler);

    return button;
  }

  public getElement(): HTMLElement {
    return this.button;
  }

  public setVisibility(visible: boolean): void {
    this.button.style.opacity = visible ? '1' : '0';
  }
}
