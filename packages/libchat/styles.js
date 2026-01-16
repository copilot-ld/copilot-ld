/**
 * Shared base styles for all chat components.
 * These CSS custom properties can be overridden by consumers.
 * @type {string}
 */
export const baseStyles = `
  :host {
    /* Colors */
    --agent-text: #24292f;
    --agent-text-subtle: #57606a;
    --agent-error: #dc2626;
    --agent-accent: #1e40af;
    --agent-accent-subtle: #0969da1a;
    --agent-bg: #ffffff;
    --agent-bg-secondary: #f8f9fa;
    --agent-border: #e1e5e9;

    /* Typography */
    --agent-font-family: system-ui, sans-serif;
    --agent-font-size: 14px;
    --agent-line-height: 1.4;

    /* Spacing */
    --agent-padding: 16px;
    --agent-gap: 8px;

    /* Z-index */
    --agent-z-index: 1000;

    font: var(--agent-font-size) var(--agent-font-family);
    line-height: var(--agent-line-height);
  }

  /* Message styles */
  article {
    margin-bottom: 1em;
    line-height: var(--agent-line-height);
  }

  article[role="user"] {
    max-width: 85%;
    margin-left: auto;
    padding: 12px;
    background: var(--agent-accent-subtle);
    color: var(--agent-accent);
  }

  article[role="error"] {
    color: var(--agent-error);
  }

  article pre {
    padding: 8px;
    border: 1px solid var(--agent-border);
    border-radius: 4px;
    background: var(--agent-bg-secondary);
    color: var(--agent-accent);
    font: 12px ui-monospace, monospace;
    overflow: auto;
  }

  details, summary {
    color: var(--agent-text-subtle);
  }

  details[open] {
    background: var(--agent-bg-secondary);
    padding-bottom: 8px;
  }

  details > *:not(summary) {
    margin-left: 4px;
    margin-right: 4px;
  }

  summary {
    cursor: pointer;
    padding: 4px;
  }

  summary::marker {
    font-size: 16px;
  }

  summary:hover {
    background: var(--agent-accent-subtle);
  }

  /* Button styles */
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
`;
