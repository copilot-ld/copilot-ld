/* eslint-env node */
import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";

/**
 * Simple TAR file extractor for .tar.gz files
 * Implements native Node.js TAR format parsing without external dependencies
 */
export class TarExtractor {
  #fs;
  #path;

  /**
   * Creates a new TAR extractor with dependency injection
   * @param {object} fs - File system module (fs/promises)
   * @param {object} path - Path module
   */
  constructor(fs, path) {
    if (!fs) throw new Error("fs dependency is required");
    if (!path) throw new Error("path dependency is required");

    this.#fs = fs;
    this.#path = path;
  }

  /**
   * Extract a .tar.gz file to specified directory
   * @param {string} tarGzPath - Path to the .tar.gz file
   * @param {string} outputDir - Directory to extract files to
   * @returns {Promise<void>}
   */
  async extract(tarGzPath, outputDir) {
    // Decompress and collect chunks
    const chunks = [];
    const input = createReadStream(tarGzPath).pipe(createGunzip());
    for await (const chunk of input) chunks.push(chunk);

    // Parse TAR format
    const buffer = Buffer.concat(chunks);
    for (let offset = 0; offset < buffer.length; ) {
      const header = buffer.slice(offset, offset + 512);

      // Check for end of archive (zero block)
      if (header.every((byte) => byte === 0)) break;

      // Parse header fields
      const name = this.#readString(header, 0, 100);
      const mode = parseInt(this.#readString(header, 100, 8), 8);
      const size = parseInt(this.#readString(header, 124, 12), 8);
      const typeFlag = header[156];

      offset += 512;

      if (size > 0) {
        const blockSize = Math.ceil(size / 512) * 512;

        // Skip unwanted files (PAX headers, macOS resource forks)
        if (
          name.includes("/._") ||
          name.startsWith("._") ||
          typeFlag === 120 ||
          typeFlag === 88
        ) {
          offset += blockSize;
          continue;
        }

        const content = buffer.slice(offset, offset + size);

        if (typeFlag === 53) {
          // Directory
          await this.#fs.mkdir(this.#path.join(outputDir, name), {
            recursive: true,
            mode,
          });
        } else {
          // Regular file
          const fullPath = this.#path.join(outputDir, name);
          await this.#fs.mkdir(this.#path.dirname(fullPath), {
            recursive: true,
          });
          await this.#fs.writeFile(fullPath, content, { mode });
        }

        offset += blockSize;
      }
    }
  }

  /**
   * Read null-terminated string from buffer
   * @param {Buffer} buffer - Source buffer
   * @param {number} start - Start position
   * @param {number} length - Maximum length to read
   * @returns {string} Extracted string
   * @private
   */
  #readString(buffer, start, length) {
    const slice = buffer.slice(start, start + length);
    const nullIndex = slice.indexOf(0);
    return slice
      .slice(0, nullIndex > -1 ? nullIndex : length)
      .toString("utf-8");
  }
}
