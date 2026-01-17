/**
 * Styles specific to the agent-drawer component.
 * Extends baseStyles with floating drawer positioning.
 * @type {string}
 */
export const drawerStyles = `
  /*
   * Host container
   */
  :host {
    position: fixed;
    z-index: var(--agent-z-index);
    right: 16px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    width: min(400px, calc(100vw - 32px));
    height: min(500px, calc(100vh - 32px));
    border: 1px solid var(--agent-color-border);
    border-radius: calc(var(--agent-radius) + 4px);
    background: var(--agent-color-bg);
    box-shadow: 0 8px 32px var(--agent-color-shadow);
    transition: width 0.2s, height 0.2s;
  }

  /*
   * Responsive breakpoints
   */
  @media (min-width: 768px) {
    :host {
      width: 420px;
      height: 560px;
    }
  }

  @media (min-width: 1200px) {
    :host {
      width: 450px;
      height: 620px;
    }
  }

  @media (min-width: 1600px) {
    :host {
      width: 480px;
      height: 680px;
    }
  }

  /*
   * State: expanded
   */
  :host([data-expanded="true"]) {
    width: min(800px, calc(100vw - 32px));
    height: min(900px, calc(100vh - 32px));
  }

  /*
   * State: collapsed
   */
  :host([data-collapsed="true"]) {
    height: 48px;
  }

  :host([data-collapsed="true"]) header {
    border-bottom: none;
    border-radius: calc(var(--agent-radius) + 3px);
  }

  /*
   * Header
   */
  header {
    height: 48px;
    flex-shrink: 0;
    border-radius: calc(var(--agent-radius) + 3px) calc(var(--agent-radius) + 3px) 0 0;
  }

  /*
   * Main
   */
  main {
    border-radius: 0;
  }

  /*
   * Footer
   */
  footer {
    border-radius: 0 0 calc(var(--agent-radius) + 3px) calc(var(--agent-radius) + 3px);
  }

  /*
   * Form
   */
  form textarea {
    min-height: 44px;
  }
`;
