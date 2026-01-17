/**
 * Styles specific to the agent-chat component.
 * Extends baseStyles with full-page centered layout.
 * @type {string}
 */
export const chatStyles = `
  /*
   * Host container
   */
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--agent-color-bg-secondary);
  }

  /*
   * Responsive breakpoints
   */
  @media (min-width: 768px) {
    main {
      padding: 24px 32px;
    }

    footer {
      padding: 16px 32px 32px;
    }
  }

  @media (min-width: 1200px) {
    main article,
    form {
      max-width: 800px;
    }

    main article[role="user"] {
      max-width: min(85%, 680px);
    }
  }

  /*
   * Header
   */
  header {
    height: 56px;
    flex-shrink: 0;
    background: var(--agent-color-bg);
  }

  header h1 {
    font-size: 18px;
  }

  header h1 mark {
    font-size: 20px;
  }

  header button {
    width: 36px;
    height: 36px;
  }

  /*
   * Main
   */
  main {
    padding: var(--agent-padding);
    background: var(--agent-color-bg-secondary);
  }

  main article {
    max-width: 768px;
    margin-left: auto;
    margin-right: auto;
  }

  main article[role="user"] {
    max-width: min(85%, 600px);
    margin-left: auto;
    margin-right: auto;
  }

  /*
   * Footer
   */
  footer {
    padding: var(--agent-padding) var(--agent-padding) 24px;
    border-top: none;
    background: var(--agent-color-bg-secondary);
  }

  /*
   * Form
   */
  form {
    max-width: 768px;
    margin: 0 auto;
  }

  form textarea {
    min-height: 56px;
    padding: 16px 56px 16px 16px;
    border-radius: calc(var(--agent-radius) + 4px);
    box-shadow: 0 2px 8px var(--agent-color-shadow);
  }

  form button {
    right: 10px;
    bottom: 10px;
    width: 40px;
    height: 40px;
  }
`;
