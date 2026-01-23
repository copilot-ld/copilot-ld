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
    padding: var(--chat-gap);
  }

  /*
   * Form layout
   */
  form {
    position: static;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /*
   * Form fields
   */
  label {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 500;
    color: var(--chat-text-muted);
  }

  input {
    display: block;
    width: 100%;
    padding: 10px 12px;
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
    margin-top: 8px;
    padding: 10px 16px;
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
    padding: 10px 12px;
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
    margin: 0 0 16px;
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
    padding: 8px 16px;
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
