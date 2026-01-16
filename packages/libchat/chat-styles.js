/**
 * Styles specific to the agent-chat component.
 * @type {string}
 */
export const chatStyles = `
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--agent-bg);
    border: 1px solid var(--agent-border);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 var(--agent-padding);
    gap: var(--agent-gap);
    background: var(--agent-bg-secondary);
    border-bottom: 1px solid var(--agent-border);
  }

  h1 {
    margin: 0 auto 0 0;
    font-weight: 600;
    font-size: 18px;
    line-height: 1;
    color: var(--agent-text);
  }

  h1 mark {
    background: transparent;
    color: var(--agent-text);
    font-size: 20px;
    margin-right: var(--agent-gap);
  }

  header button {
    width: 36px;
    height: 36px;
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
    max-width: 900px;
    margin: 0 auto;
  }

  form textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 60px;
    padding: 15px 60px 15px 15px;
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
    right: 8px;
    bottom: 8px;
    width: 44px;
    height: 44px;
    background: transparent;
    border: none;
    color: var(--agent-accent);
    font-family: inherit;
    font-weight: 500;
    font-size: 18px;
  }

  form button:hover:not(:disabled) {
    background: var(--agent-accent-subtle);
  }

  form button:disabled {
    cursor: not-allowed;
  }
`;
