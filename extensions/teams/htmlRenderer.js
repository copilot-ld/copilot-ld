import fs from "node:fs";
import path from "node:path";

/**
 * HtmlRenderer is responsible for reading HTML files from disk and serving them with appropriate headers.
 *
 * This class provides methods to serve static HTML files over HTTP and to read HTML content as a string.
 * It is used to centralize and simplify static HTML file handling in the Teams app extension server.
 */
export class HtmlRenderer {
  /**
   * Creates an instance of HtmlRenderer.
   * @param {string} baseDir - The base directory for HTML files
   */
  constructor(baseDir) {
    if (!baseDir) throw new Error("baseDir is required");
    this.baseDir = baseDir;
  }

  /**
   * Reads and serves an HTML file with the correct content type.
   * @param {string} relativePath - Relative path to the HTML file from baseDir
   * @param {import('http').ServerResponse} res - HTTP response object
   * @param {string} [contentType] - Content-Type header value
   * @returns {void}
   */
  serve(relativePath, res, contentType = "text/html") {
    const filePath = path.join(this.baseDir, relativePath);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  }

  /**
   * Reads an HTML file as a string (utf8).
   * @param {string} relativePath - Relative path to the HTML file from baseDir
   * @returns {Promise<string>} - Resolves with HTML content as string
   */
  async readHtml(relativePath) {
    const filePath = path.join(this.baseDir, relativePath);
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}
