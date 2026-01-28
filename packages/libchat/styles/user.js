/**
 * Styles for the chat-user authentication component.
 * Clean, minimal login/logout form.
 * @module libchat/styles/user
 * @type {string}
 */
export const userStyles = `
  /*
   * Host - centered card
   */
  :host {
    display: block;
    max-width: 360px;
    margin: 0 auto;
    padding: var(--chat-space-lg);
  }

  /*
   * Form layout
   */
  form {
    position: static;
    display: flex;
    flex-direction: column;
    gap: var(--chat-space-lg);
  }

  /*
   * Form fields
   */
  label {
    display: block;
    margin-bottom: var(--chat-space-xs);
    font-size: 13px;
    font-weight: 500;
    color: var(--chat-text-muted);
  }

  input {
    display: block;
    width: 100%;
    padding: var(--chat-space-md) var(--chat-space-md);
    border: 1px solid var(--chat-border);
    border-radius: var(--chat-radius);
    background: var(--chat-bg);
    color: var(--chat-text);
    font: inherit;
  }

  input::placeholder {
    color: var(--chat-text-muted);
  }

  input:focus {
    border-color: var(--chat-accent);
    outline: none;
    box-shadow: 0 0 0 2px var(--chat-accent-muted);
  }

  /*
   * Submit button - full width
   */
  form button[type="submit"] {
    position: static;
    width: 100%;
    height: auto;
    margin-top: var(--chat-space-sm);
    padding: var(--chat-space-md) var(--chat-space-lg);
    border: none;
    border-radius: var(--chat-radius);
    background: var(--chat-accent);
    color: var(--chat-text-inverse);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  form button[type="submit"]:hover {
    background: var(--chat-accent-hover);
  }

  /*
   * Error message
   */
  output {
    display: block;
    padding: var(--chat-space-md) var(--chat-space-md);
    border-radius: var(--chat-radius);
    background: rgba(220, 38, 38, 0.1);
    color: var(--chat-error);
    font-size: 13px;
  }

  output:empty {
    display: none;
  }

  /*
   * Logged in state
   */
  aside {
    text-align: center;
  }

  aside p {
    margin: 0 0 var(--chat-space-lg);
    color: var(--chat-text-muted);
  }

  aside strong {
    color: var(--chat-text);
    font-weight: 500;
  }

  /*
   * Logout button
   */
  aside button {
    padding: var(--chat-space-sm) var(--chat-space-lg);
    border: 1px solid var(--chat-border);
    border-radius: var(--chat-radius);
    background: transparent;
    color: var(--chat-text);
    font: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }

  aside button:hover {
    background: var(--chat-bg-muted);
  }

  /*
   * No auth configured message
   */
  p {
    margin: 0;
    color: var(--chat-text-muted);
    text-align: center;
  }
`;
