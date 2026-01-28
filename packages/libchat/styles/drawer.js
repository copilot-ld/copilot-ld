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
    right: var(--chat-space-lg);
    bottom: var(--chat-space-lg);
    display: flex;
    flex-direction: column;
    width: min(400px, calc(100vw - var(--chat-space-2xl)));
    height: min(500px, calc(100vh - var(--chat-space-2xl)));
    border: 1px solid var(--chat-border);
    border-radius: var(--chat-radius-lg);
    background: var(--chat-bg);
    box-shadow: 0 var(--chat-space-sm) var(--chat-space-2xl) var(--chat-shadow);
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
    width: min(800px, calc(100vw - var(--chat-space-2xl)));
    height: min(900px, calc(100vh - var(--chat-space-2xl)));
  }

  /*
   * State: collapsed
   */
  :host([data-collapsed="true"]) {
    height: calc(var(--chat-space-lg) * 3);
    overflow: hidden;
  }

  :host([data-collapsed="true"]) header {
    border-bottom: none;
  }

  /*
   * Header - rounded top corners
   */
  header {
    border-radius: calc(var(--chat-radius-lg) - 1px) calc(var(--chat-radius-lg) - 1px) 0 0;
  }

  :host([data-collapsed="true"]) header {
    border-radius: calc(var(--chat-radius-lg) - 1px);
  }

  /*
   * Footer - rounded bottom corners
   */
  footer {
    border-radius: 0 0 calc(var(--chat-radius-lg) - 1px) calc(var(--chat-radius-lg) - 1px);
  }
`;
