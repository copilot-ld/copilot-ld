/* eslint-env node */

/**
 * Formats tool description from JSON structure to readable text
 * @param {string} content - Tool content field (may be JSON string or plain text)
 * @returns {string} Formatted description for LLM
 */
export function formatToolDescription(content) {
  if (typeof content !== "string") {
    return content;
  }

  try {
    const parsed = JSON.parse(content);

    // Check if this is a structured tool description
    if (
      parsed.purpose ||
      parsed.applicability ||
      parsed.instructions ||
      parsed.evaluation
    ) {
      const parts = [];

      if (parsed.purpose) {
        parts.push(`PURPOSE: ${parsed.purpose.trim()}`);
      }

      if (parsed.applicability) {
        parts.push(`WHEN TO USE: ${parsed.applicability.trim()}`);
      }

      if (parsed.instructions) {
        parts.push(`HOW TO USE: ${parsed.instructions.trim()}`);
      }

      if (parsed.evaluation) {
        parts.push(`RETURNS: ${parsed.evaluation.trim()}`);
      }

      return parts.join("\n\n");
    }

    // JSON parsed but not structured - return as-is
    return content;
  } catch {
    // If parsing fails, use the original content as-is
    return content;
  }
}

/**
 * Normalizes a vector to unit length
 * @param {number[]} vector - Vector to normalize
 * @returns {number[]} Normalized vector
 */
export function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector.slice(); // Return copy of zero vector
  return vector.map((val) => val / magnitude);
}
