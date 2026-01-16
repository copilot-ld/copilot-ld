/**
 * Styles specific to the agent-drawer component.
 * @type {string}
 */
export const drawerStyles = `
  :host {
    position: fixed;
    z-index: var(--agent-z-index);
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    width: 400px;
    height: 600px;
    background: var(--agent-bg);
    border: 1px solid var(--agent-border);
    box-shadow: 0 8px 32px var(--agent-border);
    transition: all 0.2s ease-in-out;
  }

  :host([data-expanded="true"]) {
    width: 800px;
    height: 1000px;
  }

  :host([data-collapsed="true"]) {
    height: 50px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 50px;
    padding: 0 var(--agent-padding);
    gap: var(--agent-gap);
    background: var(--agent-bg-secondary);
    border-bottom: 1px solid var(--agent-border);
  }

  h1 {
    margin: 0 auto 0 0;
    font-weight: 600;
    font-size: 16px;
    line-height: 1;
    color: var(--agent-text);
  }

  h1 mark {
    background: transparent;
    color: var(--agent-text);
    font-size: 18px;
    margin-right: var(--agent-gap);
  }

  header button {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    color: var(--agent-text);
    font-size: 18px;
  }

  header button:hover {
    background: var(--agent-accent-subtle);
  }

  main {
    flex: 1;
    padding: var(--agent-padding);
    overflow-y: auto;
  }

  footer {
    padding: var(--agent-padding);
    border-top: 1px solid var(--agent-border);
  }

  form {
    position: relative;
    margin: 0;
  }

  form textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    padding: 10px 48px 10px 12px;
    border: 1px solid var(--agent-border);
    font: inherit;
    line-height: var(--agent-line-height);
    resize: none;
  }

  form textarea:focus {
    outline: none;
    border-color: var(--agent-accent);
  }

  form textarea:disabled {
    background: var(--agent-bg-secondary);
  }

  form button {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    color: var(--agent-accent);
    font-family: inherit;
    font-weight: 500;
    font-size: 16px;
  }

  form button:hover:not(:disabled) {
    background: var(--agent-accent-subtle);
  }

  form button:disabled {
    cursor: not-allowed;
  }
`;
