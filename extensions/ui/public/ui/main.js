/**
 * Main entry point for UI extension.
 * Creates ChatClient and injects into all chat elements on page.
 * @module ui/main
 */

import {
  ChatClient,
  ChatDrawerElement as _ChatDrawerElement,
  ChatPageElement as _ChatPageElement,
  ChatUserElement as _ChatUserElement,
} from "/ui/libchat/index.js";

// Side-effect imports: Custom elements are registered when imported
void _ChatDrawerElement;
void _ChatPageElement;
void _ChatUserElement;

// Prevent duplicate initialization
if (!window.__chatClientInitialized) {
  window.__chatClientInitialized = true;

  // Get configuration from meta tags
  const chatUrl =
    document.querySelector('meta[name="chat-url"]')?.content ||
    `${window.location.origin}/web/api`;
  const authUrl = document.querySelector('meta[name="auth-url"]')?.content;
  const anonKey = document.querySelector('meta[name="anon-key"]')?.content;

  // Create client with optional auth
  const config = { chatUrl };
  if (authUrl) {
    config.auth = { url: authUrl, anonKey };
  }

  const client = new ChatClient(config);

  // Inject client into all chat elements once DOM is ready
  function injectClient() {
    document
      .querySelectorAll("chat-drawer, chat-page, chat-user")
      .forEach((el) => {
        if (!el.client) {
          el.client = client;
        }
      });
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectClient);
  } else {
    injectClient();
  }

  // Export for advanced use cases
  window.chatClient = client;
}
