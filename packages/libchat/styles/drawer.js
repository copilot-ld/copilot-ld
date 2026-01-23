/**
 * Styles for the chat-drawer component.
 * Floating drawer that can be collapsed/expanded.
 * @module libchat/styles/drawer
 * @type {string}
 */
export const drawerStyles = `
  /*
   * Host - fixed position floating panel
   */
  :host {
    position: fixed;
    z-index: var(--chat-z);
    right: 16px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    width: min(400px, calc(100vw - 32px));
    height: min(500px, calc(100vh - 32px));
    border: 1px solid var(--chat-border);
    border-radius: 12px;
    background: var(--chat-bg);
    box-shadow: 0 8px 32px var(--chat-shadow);
    transition: width 0.2s, height 0.2s;
  }

  /* Tablet */
  @media (min-width: 768px) {
    :host {
      width: 420px;
      height: 560px;
    }
  }

  /* Desktop */
  @media (min-width: 1200px) {
    :host {
      width: 450px;
      height: 620px;
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
    overflow: hidden;
  }

  :host([data-collapsed="true"]) header {
    border-bottom: none;
  }

  /*
   * Header - rounded top corners
   */
  header {
    border-radius: 11px 11px 0 0;
  }

  :host([data-collapsed="true"]) header {
    border-radius: 11px;
  }

  /*
   * Footer - rounded bottom corners
   */
  footer {
    border-radius: 0 0 11px 11px;
  }
`;
