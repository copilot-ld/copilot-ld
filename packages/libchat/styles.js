/**
 * Shared base styles for all chat components.
 * CSS custom properties can be overridden by consumers.
 * @type {string}
 */
export const baseStyles = `
  :host {
    /* Color palette - Light mode (default) */
    --agent-color-text: #24292f;
    --agent-color-text-subtle: #57606a;
    --agent-color-text-inverse: #ffffff;
    --agent-color-bg: #ffffff;
    --agent-color-bg-secondary: #f6f8fa;
    --agent-color-bg-tertiary: #eff1f3;
    --agent-color-border: #d1d5db;
    --agent-color-shadow: rgba(0, 0, 0, 0.1);
    --agent-color-accent: #1e40af;
    --agent-color-accent-hover: #1e3a8a;
    --agent-color-accent-subtle: rgba(9, 105, 218, 0.1);
    --agent-color-error: #dc2626;

    /* Typography */
    --agent-font-family: system-ui, -apple-system, sans-serif;
    --agent-font-size: 14px;
    --agent-line-height: 1.5;

    /* Layout */
    --agent-radius: 8px;
    --agent-padding: 16px;
    --agent-gap: 8px;
    --agent-z-index: 1000;

    font: var(--agent-font-size) var(--agent-font-family);
    line-height: var(--agent-line-height);
    color: var(--agent-color-text);
  }

  /* Color palette - Dark mode */
  @media (prefers-color-scheme: dark) {
    :host {
      --agent-color-text: #e6edf3;
      --agent-color-text-subtle: #8b949e;
      --agent-color-text-inverse: #ffffff;
      --agent-color-bg: #0d1117;
      --agent-color-bg-secondary: #161b22;
      --agent-color-bg-tertiary: #21262d;
      --agent-color-border: #30363d;
      --agent-color-shadow: rgba(0, 0, 0, 0.4);
      --agent-color-accent: #58a6ff;
      --agent-color-accent-hover: #79b8ff;
      --agent-color-accent-subtle: rgba(56, 139, 253, 0.15);
      --agent-color-error: #f87171;
    }
  }

  /* Messages */
  article { margin-bottom: 1em; line-height: var(--agent-line-height); }
  article[role="user"] {
    max-width: 85%; margin-left: auto; padding: 12px 16px;
    border-radius: var(--agent-radius);
    background: var(--agent-color-accent); color: var(--agent-color-text-inverse);
  }
  article[role="assistant"] { color: var(--agent-color-text); }
  article[role="error"] { color: var(--agent-color-error); }
  article pre {
    padding: 12px; border: 1px solid var(--agent-color-border);
    border-radius: var(--agent-radius); background: var(--agent-color-bg-tertiary);
    color: var(--agent-color-text); font: 13px ui-monospace, monospace; overflow: auto;
  }

  /* Details */
  details, summary { color: var(--agent-color-text-subtle); }
  details[open] {
    padding-bottom: 8px; border-radius: var(--agent-radius);
    background: var(--agent-color-bg-secondary);
  }
  details > *:not(summary) { margin-left: 8px; margin-right: 8px; }
  summary {
    padding: 6px 8px; border-radius: var(--agent-radius); cursor: pointer;
  }
  summary::marker { font-size: 14px; }
  summary:hover { background: var(--agent-color-accent-subtle); }

  /* Buttons */
  button {
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--agent-radius); cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  /* Header */
  header {
    display: flex; align-items: center; gap: var(--agent-gap);
    padding: 0 var(--agent-padding);
    border-bottom: 1px solid var(--agent-color-border);
    background: var(--agent-color-bg-secondary);
  }
  header h1 {
    margin: 0 auto 0 0; font-size: 16px; font-weight: 600;
    line-height: 1; color: var(--agent-color-text);
  }
  header h1 mark {
    margin-right: var(--agent-gap);
    background: transparent; color: var(--agent-color-accent);
  }
  header button {
    width: 32px; height: 32px; border: none;
    background: transparent; color: var(--agent-color-text-subtle); font-size: 18px;
  }
  header button:hover {
    background: var(--agent-color-accent-subtle); color: var(--agent-color-text);
  }

  /* Main */
  main {
    flex: 1; padding: var(--agent-padding);
    background: var(--agent-color-bg); overflow-y: auto;
  }

  /* Footer */
  footer {
    padding: var(--agent-padding);
    border-top: 1px solid var(--agent-color-border);
    background: var(--agent-color-bg);
  }

  /* Form */
  form { position: relative; margin: 0; }
  form textarea {
    box-sizing: border-box; width: 100%; padding: 12px 48px 12px 14px;
    border: 1px solid var(--agent-color-border); border-radius: var(--agent-radius);
    background: var(--agent-color-bg); color: var(--agent-color-text);
    font: inherit; line-height: var(--agent-line-height); resize: none;
  }
  form textarea::placeholder { color: var(--agent-color-text-subtle); }
  form textarea:focus {
    border-color: var(--agent-color-accent); outline: none;
    box-shadow: 0 0 0 2px var(--agent-color-accent-subtle);
  }
  form textarea:disabled {
    background: var(--agent-color-bg-secondary); color: var(--agent-color-text-subtle);
  }
  form button {
    position: absolute; right: 6px; bottom: 6px; width: 36px; height: 36px;
    border: none; background: var(--agent-color-accent);
    color: var(--agent-color-text-inverse); font-size: 16px;
  }
  form button:hover:not(:disabled) { background: var(--agent-color-accent-hover); }
  form button:disabled {
    background: var(--agent-color-bg-tertiary);
    color: var(--agent-color-text-subtle); cursor: not-allowed;
  }
`;
