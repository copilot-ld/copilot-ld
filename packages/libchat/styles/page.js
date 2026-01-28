/**
 * Styles for the chat-page component.
 * Full-page chat with centered empty state like ChatGPT.
 * @module libchat/styles/page
 * @type {string}
 */
export const pageStyles = `
  /*
   * Host - full page flex container, transparent to integrate with page
   */
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: transparent;
  }

  /*
   * Empty state - everything centered
   */
  :host([data-empty]) {
    justify-content: center;
    align-items: center;
  }

  :host([data-empty]) section {
    width: 100%;
    min-width: 480px;
    max-width: 720px;
    margin: 0 auto;
    padding: 0 var(--chat-space-lg);
    text-align: center;
    box-sizing: border-box;
  }

  :host([data-empty]) section h2 {
    margin: 0 0 var(--chat-space-lg);
    font-size: 24px;
    font-weight: 600;
  }

  :host([data-empty]) section h2 mark {
    background: none;
    color: var(--chat-accent);
    margin-right: var(--chat-space-sm);
  }

  :host([data-empty]) section form {
    margin-top: 0;
    text-align: left;
  }

  /*
   * Messages layout - centered with max-width
   */
  main {
    background: transparent;
  }

  main article {
    max-width: 720px;
    margin-left: auto;
    margin-right: auto;
  }

  main article[role="user"] {
    max-width: min(85%, 600px);
  }

  /*
   * Footer
   */
  footer {
    background: transparent;
    border-top: none;
  }

  /*
   * Form - centered with max-width
   */
  form {
    max-width: 720px;
    margin: 0 auto;
  }

  textarea {
    min-height: 100px;
    padding-bottom: calc(var(--chat-space-lg) * 2.75);
    border-radius: var(--chat-radius-lg);
    box-shadow: 0 2px var(--chat-space-md) var(--chat-shadow);
  }

  /*
   * Buttons - bottom right of textarea
   */
  button[type="submit"] {
    bottom: var(--chat-space-md);
    right: var(--chat-space-md);
  }

  /*
   * New conversation button
   */
  button#new {
    position: absolute;
    right: calc(var(--chat-space-md) + var(--chat-space-2xl) + var(--chat-space-sm));
    bottom: var(--chat-space-md);
    background: var(--chat-bg-muted);
    color: var(--chat-text-muted);
    font-size: 18px;
  }

  button#new:hover {
    background: var(--chat-accent-muted);
    color: var(--chat-text);
  }

  /*
   * Responsive - larger screens
   */
  @media (min-width: 768px) {
    main {
      padding: var(--chat-space-xl) var(--chat-space-2xl);
    }

    footer {
      padding: var(--chat-space-lg) var(--chat-space-2xl) var(--chat-space-2xl);
    }
  }
`;
