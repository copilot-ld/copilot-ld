/**
 * Shared base styles for all chat components.
 * @module libchat/styles/base
 * @type {string}
 */
export const baseStyles = `
  /* Light mode */
  :host {
    --chat-text: #1f2937;
    --chat-text-muted: #6b7280;
    --chat-text-inverse: #ffffff;
    --chat-bg: #ffffff;
    --chat-bg-alt: #f9fafb;
    --chat-bg-muted: #f3f4f6;
    --chat-border: #e5e7eb;
    --chat-shadow: rgba(0, 0, 0, 0.08);
    --chat-accent: #2563eb;
    --chat-accent-hover: #1d4ed8;
    --chat-accent-muted: rgba(37, 99, 235, 0.1);
    --chat-error: #dc2626;
    --chat-space-xs: 4px;
    --chat-space-sm: 8px;
    --chat-space-md: 12px;
    --chat-space-lg: 16px;
    --chat-space-xl: 24px;
    --chat-space-2xl: 32px;
    --chat-radius: 8px;
    --chat-radius-lg: 12px;
    --chat-z: 1000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--chat-text);
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    :host {
      --chat-text: #f9fafb;
      --chat-text-muted: #9ca3af;
      --chat-bg: #111827;
      --chat-bg-alt: #1f2937;
      --chat-bg-muted: #374151;
      --chat-border: #374151;
      --chat-shadow: rgba(0, 0, 0, 0.3);
      --chat-accent: #3b82f6;
      --chat-accent-hover: #60a5fa;
      --chat-accent-muted: rgba(59, 130, 246, 0.15);
      --chat-error: #f87171;
    }
  }

  /* Reset */
  *, *::before, *::after { box-sizing: border-box; }

  /* Icon button */
  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--chat-space-2xl);
    height: var(--chat-space-2xl);
    padding: 0;
    border: none;
    border-radius: calc(var(--chat-radius) - 2px);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  /* Header */
  header {
    display: flex;
    align-items: center;
    gap: var(--chat-space-sm);
    height: calc(var(--chat-space-lg) * 3);
    padding: 0 var(--chat-space-lg);
    border-bottom: 1px solid var(--chat-border);
    background: var(--chat-bg);
    flex-shrink: 0;
  }

  header h1 {
    flex: 1;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  header h1 mark {
    margin-right: var(--chat-space-sm);
    background: none;
    color: var(--chat-accent);
  }

  header button {
    flex-shrink: 0;
    background: transparent;
    color: var(--chat-text-muted);
    font-size: 16px;
  }

  header button:hover {
    background: var(--chat-accent-muted);
    color: var(--chat-text);
  }

  /* Main - scrollable message area */
  main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--chat-space-lg);
    background: var(--chat-bg-alt);
  }

  /* Messages */
  article {
    position: relative;
    margin-bottom: var(--chat-space-md);
    line-height: 1.5;
  }

  article:last-child { margin-bottom: 0; }

  article[role="user"] {
    max-width: 85%;
    margin-left: auto;
    padding: var(--chat-space-md) var(--chat-space-lg);
    border-radius: var(--chat-radius);
    background: var(--chat-accent);
    color: var(--chat-text-inverse);
  }

  article[role="assistant"] { color: var(--chat-text); }
  article[role="error"] { color: var(--chat-error); }

  article pre {
    margin: var(--chat-space-sm) 0;
    padding: var(--chat-space-md);
    border-radius: calc(var(--chat-radius) - 2px);
    background: var(--chat-bg-muted);
    font-family: ui-monospace, monospace;
    font-size: 13px;
    overflow-x: auto;
  }

  /* Details/Summary */
  details { margin: var(--chat-space-sm) 0; color: var(--chat-text-muted); }
  summary { padding: var(--chat-space-xs) var(--chat-space-sm); border-radius: var(--chat-space-xs); cursor: pointer; }
  summary:hover { background: var(--chat-accent-muted); }

  /* Footer */
  footer {
    flex-shrink: 0;
    padding: var(--chat-space-lg);
    border-top: 1px solid var(--chat-border);
    background: var(--chat-bg);
  }

  /* Form */
  form { position: relative; margin: 0; }

  textarea {
    display: block;
    width: 100%;
    min-height: calc(var(--chat-space-lg) * 2.75);
    max-height: 200px;
    padding: var(--chat-space-md) calc(var(--chat-space-lg) * 3) var(--chat-space-md) var(--chat-space-lg);
    border: 1px solid var(--chat-border);
    border-radius: var(--chat-radius);
    background: var(--chat-bg);
    color: var(--chat-text);
    font: inherit;
    line-height: 1.5;
    resize: none;
  }

  textarea::placeholder {
    color: var(--chat-text-muted);
  }

  textarea:focus {
    border-color: var(--chat-accent);
    outline: none;
    box-shadow: 0 0 0 2px var(--chat-accent-muted);
  }

  textarea:disabled {
    background: var(--chat-bg-muted);
    color: var(--chat-text-muted);
  }

  /* Send button */
  button[type="submit"] {
    position: absolute;
    right: var(--chat-space-sm);
    bottom: var(--chat-space-sm);
    background: var(--chat-accent);
    color: var(--chat-text-inverse);
    font-size: 14px;
  }

  button[type="submit"]:hover:not(:disabled) {
    background: var(--chat-accent-hover);
  }

  button[type="submit"]:disabled {
    background: var(--chat-bg-muted);
    color: var(--chat-text-muted);
    cursor: not-allowed;
  }

  /* Feedback buttons */
  .feedback {
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
    gap: var(--chat-space-xs);
    opacity: 0;
    transition: opacity 0.15s;
  }

  article:hover .feedback,
  .feedback:focus-within {
    opacity: 1;
  }

  .feedback button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--chat-space-xl);
    height: var(--chat-space-xl);
    padding: 0;
    border: 1px solid var(--chat-border);
    border-radius: var(--chat-space-xs);
    background: var(--chat-bg);
    color: var(--chat-text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .feedback button:hover {
    background: var(--chat-accent-muted);
    border-color: var(--chat-accent);
    color: var(--chat-text);
  }

  .feedback button[data-selected="true"] {
    background: var(--chat-accent-muted);
    border-color: var(--chat-accent);
    color: var(--chat-accent);
  }

  .feedback button[data-signal="positive"]:hover,
  .feedback button[data-signal="positive"][data-selected="true"] {
    color: #16a34a;
    border-color: #16a34a;
    background: rgba(22, 163, 74, 0.1);
  }

  .feedback button[data-signal="negative"]:hover,
  .feedback button[data-signal="negative"][data-selected="true"] {
    color: var(--chat-error);
    border-color: var(--chat-error);
    background: rgba(220, 38, 38, 0.1);
  }
`;
