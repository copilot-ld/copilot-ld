/**
 * Supabase authentication module for UI extension
 * Uses @supabase/supabase-js loaded from CDN via importmap
 */

/** @type {import("@supabase/supabase-js").SupabaseClient|null} */
let supabaseClient = null;

/**
 * Initializes the Supabase client with configuration from window.ENV
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function initSupabase() {
  if (supabaseClient) return supabaseClient;

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ENV || {};
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase configuration not available in window.ENV");
    return null;
  }

  // Using the global from CDN
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );
  return supabaseClient;
}

/**
 * Signs in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{session: object|null, error: Error|null}>}
 */
export async function signIn(email, password) {
  const client = initSupabase();
  if (!client) {
    return { session: null, error: new Error("Supabase not configured") };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  return { session: data?.session || null, error };
}

/**
 * Signs out the current user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  const client = initSupabase();
  if (!client) {
    return { error: new Error("Supabase not configured") };
  }

  const { error } = await client.auth.signOut();
  return { error };
}

/**
 * Gets the current session
 * @returns {Promise<{session: object|null, error: Error|null}>}
 */
export async function getSession() {
  const client = initSupabase();
  if (!client) {
    return { session: null, error: null };
  }

  const { data, error } = await client.auth.getSession();
  return { session: data?.session || null, error };
}

/**
 * Gets the current access token for API calls
 * @returns {Promise<string|null>}
 */
export async function getAccessToken() {
  const { session } = await getSession();
  return session?.access_token || null;
}

/**
 * Sets up an auth state change listener
 * @param {function} callback - Callback called with (event, session)
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const client = initSupabase();
  if (!client) {
    return () => {};
  }

  const { data } = client.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

/**
 * Makes an authenticated fetch request
 * @param {string} url - Request URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function authFetch(url, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
