/**
 * GoTrue authentication client.
 *
 * Lightweight auth client using direct fetch calls to GoTrue API.
 * Compatible with both standalone GoTrue and Supabase Auth.
 * Dependencies are injected for backend/frontend portability.
 * @module libchat/auth
 * @example
 * // Frontend usage
 * const auth = new ChatAuth(
 *   'http://localhost:9999',
 *   localStorage,
 *   fetch.bind(window),
 *   'your-anon-key'
 * );
 * await auth.signIn('user@example.com', 'password');
 *
 * // Backend usage (with in-memory storage)
 * const auth = new ChatAuth(
 *   process.env.AUTH_URL,
 *   new Map(),
 *   globalThis.fetch
 * );
 */

const STORAGE_KEY = "gotrue.user";

/**
 * @typedef {object} Session
 * @property {string} access_token - JWT access token
 * @property {string} refresh_token - Refresh token
 * @property {number} expires_at - Expiration timestamp (seconds)
 * @property {object} user - User object
 */

/**
 * @typedef {object} Storage
 * @property {(key: string) => string|null} getItem - Get item by key
 * @property {(key: string, value: string) => void} setItem - Set item
 * @property {(key: string) => void} removeItem - Remove item
 */

/**
 * GoTrue authentication client with dependency injection.
 */
export class ChatAuth {
  #url;
  #anonKey;
  #storage;
  #fetch;
  #session;
  #listeners;

  /**
   * Creates a ChatAuth instance.
   * @param {string} url - GoTrue API base URL
   * @param {Storage|Map} storage - Storage implementation (localStorage, Map, etc.)
   * @param {(url: string, init?: object) => Promise<Response>} fetch - Fetch implementation
   * @param {string} [anonKey] - Supabase anonymous key (optional)
   */
  constructor(url, storage, fetch, anonKey = null) {
    if (!url) throw new Error("url is required");
    if (!storage) throw new Error("storage is required");
    if (!fetch) throw new Error("fetch is required");

    this.#url = url;
    this.#anonKey = anonKey;
    this.#storage = storage;
    this.#fetch = fetch;
    this.#session = null;
    this.#listeners = [];

    this.#loadSession();
  }

  /** Loads session from storage. */
  #loadSession() {
    const stored = this.#storageGet(STORAGE_KEY);
    if (!stored) return;

    const session = JSON.parse(stored);
    if (session.expires_at && session.expires_at < Date.now() / 1000) {
      this.#storageRemove(STORAGE_KEY);
      return;
    }
    this.#session = session;
  }

  /**
   * Gets item from storage (supports both localStorage and Map).
   * @param {string} key - Storage key
   * @returns {string|null} Stored value or null
   */
  #storageGet(key) {
    if (typeof this.#storage.getItem === "function") {
      return this.#storage.getItem(key);
    }
    return this.#storage.get(key) ?? null;
  }

  /**
   * Sets item in storage (supports both localStorage and Map).
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  #storageSet(key, value) {
    if (typeof this.#storage.setItem === "function") {
      this.#storage.setItem(key, value);
    } else {
      this.#storage.set(key, value);
    }
  }

  /**
   * Removes item from storage (supports both localStorage and Map).
   * @param {string} key - Storage key
   */
  #storageRemove(key) {
    if (typeof this.#storage.removeItem === "function") {
      this.#storage.removeItem(key);
    } else {
      this.#storage.delete(key);
    }
  }

  /**
   * Persists session to storage.
   * @param {Session|null} session - Session to store
   */
  #persistSession(session) {
    if (session) {
      this.#storageSet(STORAGE_KEY, JSON.stringify(session));
    } else {
      this.#storageRemove(STORAGE_KEY);
    }
  }

  /**
   * Notifies listeners of auth state change.
   * @param {string} event - Event type (SIGNED_IN, SIGNED_OUT)
   * @param {Session|null} session - Current session
   */
  #notify(event, session) {
    for (const callback of this.#listeners) {
      callback(event, session);
    }
  }

  /**
   * Builds headers for auth API requests.
   * @param {object} [extra] - Additional headers
   * @returns {object} Headers object with content type and optional apikey
   */
  #headers(extra = {}) {
    const headers = { "Content-Type": "application/json", ...extra };
    if (this.#anonKey) {
      headers.apikey = this.#anonKey;
    }
    return headers;
  }

  /**
   * Extracts session from API response data.
   * @param {object} data - API response
   * @returns {Session} Normalized session object
   */
  #extractSession(data) {
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user,
    };
  }

  /**
   * Signs in with email and password.
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{session: Session|null, error: Error|null}>} Sign in result
   */
  async signIn(email, password) {
    const response = await this.#fetch(
      `${this.#url}/token?grant_type=password`,
      {
        method: "POST",
        headers: this.#headers(),
        body: JSON.stringify({ email, password }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return { session: null, error: new Error(error.msg || "Sign in failed") };
    }

    const data = await response.json();
    this.#session = this.#extractSession(data);
    this.#persistSession(this.#session);
    this.#notify("SIGNED_IN", this.#session);

    return { session: this.#session, error: null };
  }

  /**
   * Signs up with email and password.
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{session: Session|null, user: object|null, error: Error|null}>} Sign up result
   */
  async signUp(email, password) {
    const response = await this.#fetch(`${this.#url}/signup`, {
      method: "POST",
      headers: this.#headers(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        session: null,
        user: null,
        error: new Error(error.msg || "Sign up failed"),
      };
    }

    const data = await response.json();

    if (data.access_token) {
      this.#session = this.#extractSession(data);
      this.#persistSession(this.#session);
      this.#notify("SIGNED_IN", this.#session);
      return { session: this.#session, user: data.user, error: null };
    }

    return { session: null, user: data, error: null };
  }

  /**
   * Signs out the current user.
   * @returns {Promise<{error: Error|null}>} Sign out result
   */
  async signOut() {
    if (!this.#session) {
      return { error: null };
    }

    let error = null;
    try {
      await this.#fetch(`${this.#url}/logout`, {
        method: "POST",
        headers: this.#headers({
          Authorization: `Bearer ${this.#session.access_token}`,
        }),
      });
    } catch (e) {
      error = e;
    }

    this.#session = null;
    this.#persistSession(null);
    this.#notify("SIGNED_OUT", null);

    return { error };
  }

  /**
   * Gets the current session.
   * @returns {{session: Session|null, error: null}} Current session state
   */
  getSession() {
    return { session: this.#session, error: null };
  }

  /**
   * Gets the current access token.
   * @returns {string|null} Access token or null if not authenticated
   */
  getAccessToken() {
    return this.#session?.access_token ?? null;
  }

  /**
   * Registers an auth state change listener.
   * @param {(event: string, session: Session|null) => void} callback - Listener callback
   * @returns {() => void} Unsubscribe function
   */
  onAuthStateChange(callback) {
    this.#listeners.push(callback);

    const event = this.#session ? "SIGNED_IN" : "SIGNED_OUT";
    callback(event, this.#session);

    return () => {
      const index = this.#listeners.indexOf(callback);
      if (index > -1) {
        this.#listeners.splice(index, 1);
      }
    };
  }

  /**
   * Makes an authenticated fetch request.
   * @param {string} url - Request URL
   * @param {object} [options] - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetch(url, options = {}) {
    const token = this.getAccessToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return this.#fetch(url, { ...options, headers });
  }
}
