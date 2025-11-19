/* eslint-env node */
import { createTerminalFormatter } from "@copilot-ld/libformat";
import prettier from "prettier";

/**
 * Formats markdown content with line numbers
 * @param {string} markdown - The markdown content to format
 * @returns {Promise<string>} Formatted markdown with line numbers
 */
export async function formatForAnalysis(markdown) {
  // Format markdown with Prettier
  const prettierFormatted = await prettier.format(markdown, {
    parser: "markdown",
    proseWrap: "always",
    printWidth: 72,
  });

  // Apply terminal formatting
  const formatter = createTerminalFormatter();
  const formatted = formatter.format(prettierFormatted);

  // Split into lines and add line numbers
  const lines = formatted.split("\n");
  const numberedLines = lines.map((line, index) => {
    const lineNum = String(index + 1).padStart(4, " ");
    return `${lineNum}  | ${line}`;
  });

  return numberedLines.join("\n");
}
