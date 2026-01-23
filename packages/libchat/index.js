/**
 * Chat web components for Copilot-LD.
 *
 * Provides a composed client and web components for chat integration.
 * @module libchat
 * @example
 * import { ChatClient, ChatDrawerElement } from "@copilot-ld/libchat";
 *
 * const client = new ChatClient({
 *   chatUrl: "/api",
 *   auth: { url: "http://localhost:9999", anonKey: "key" }
 * });
 *
 * document.querySelector("chat-drawer").client = client;
 */

// Core services
export { ChatClient } from "./client.js";
export { ChatApi, formatMessage } from "./api.js";
export { ChatAuth } from "./auth.js";
export { ChatState } from "./state.js";

// Web components
export { ChatDrawerElement } from "./elements/drawer.js";
export { ChatPageElement } from "./elements/page.js";
export { ChatUserElement } from "./elements/user.js";
