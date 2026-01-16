/**
 * API client for chat communication.
 * Handles HTTP requests to the chat API endpoint.
 */

/**
 * Send a chat message to the API.
 * @param {string} apiUrl - Base API URL
 * @param {string} message - User message
 * @param {string|null} resourceId - Conversation resource ID
 * @returns {Promise<Response>} - Fetch response with streaming body
 */
export async function sendChatMessage(apiUrl, message, resourceId) {
  const response = await fetch(`${apiUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      resource_id: resourceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

/**
 * Read a streaming response line by line.
 * @param {Response} response - Fetch response
 * @yields {object} Parsed JSON objects
 */
export async function* readStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          yield JSON.parse(line);
        } catch (error) {
          console.error("Failed to parse stream chunk:", line, error);
        }
      }
    }
  }

  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer);
    } catch (error) {
      console.error("Failed to parse final chunk:", buffer, error);
    }
  }
}

/**
 * Format a message for display.
 * @param {object} msg - Message object from API
 * @returns {string} - Formatted content
 */
export function formatMessage(msg) {
  if (msg.tool_calls?.length) {
    const tools = msg.tool_calls.map((tc) => tc.function.name).join(", ");
    return msg.content || `Calling tools: ${tools}`;
  }
  if (msg.role === "tool") {
    return `Tool Result: ${msg.content}`;
  }
  return msg.content || "";
}
