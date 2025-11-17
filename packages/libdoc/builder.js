/* eslint-env node */
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";

/**
 * Documentation builder for converting Markdown files to HTML
 */
export class DocsBuilder {
  #fs;
  #path;
  #marked;
  #matter;
  #mustacheRender;
  #prettier;

  /**
   * Creates a new DocsBuilder instance
   * @param {object} fs - File system module
   * @param {object} path - Path module
   * @param {Function} markedParser - Marked parser function
   * @param {Function} matterParser - Front matter parser function
   * @param {Function} mustacheRender - Mustache render function
   * @param {object} prettier - Prettier module for HTML formatting
   */
  constructor(fs, path, markedParser, matterParser, mustacheRender, prettier) {
    if (!fs) throw new Error("fs is required");
    if (!path) throw new Error("path is required");
    if (!markedParser) throw new Error("markedParser is required");
    if (!matterParser) throw new Error("matterParser is required");
    if (!mustacheRender) throw new Error("mustacheRender is required");
    if (!prettier) throw new Error("prettier is required");

    this.#fs = fs;
    this.#path = path;
    this.#marked = markedParser;
    this.#matter = matterParser;
    this.#mustacheRender = mustacheRender;
    this.#prettier = prettier;

    // Configure marked with extensions
    this.#marked.use(
      gfmHeadingId({
        prefix: "", // No prefix for heading IDs
      }),
    );

    this.#marked.use(
      markedHighlight({
        langPrefix: "language-", // Adds 'language-' prefix to code block classes
        highlight(code, _lang) {
          // Return the code as-is with proper language class
          // Prism.js will handle highlighting on the client side
          return code;
        },
      }),
    );
  }

  /**
   * Generate table of contents from h2 headings
   * @param {string} html - HTML content to extract headings from
   * @returns {string} HTML list of ToC links
   */
  #generateToc(html) {
    const headings = Array.from(
      html.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g),
      (m) => `<li><a href="#${m[1]}">${m[2]}</a></li>`,
    );
    return headings.length ? `<ul>${headings.join("\n")}</ul>` : "";
  }

  /**
   * Copy directory recursively
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   * @returns {boolean} True if directory was copied
   */
  #copyDir(src, dest) {
    if (!this.#fs.existsSync(src)) return false;

    this.#fs.mkdirSync(dest, { recursive: true });
    const entries = this.#fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = this.#path.join(src, entry.name);
      const destPath = this.#path.join(dest, entry.name);
      entry.isDirectory()
        ? this.#copyDir(srcPath, destPath)
        : this.#fs.copyFileSync(srcPath, destPath);
    }
    return true;
  }

  /**
   * Copy static assets to distribution directory
   * @param {string} docsDir - Source docs directory
   * @param {string} distDir - Destination distribution directory
   */
  #copyStaticAssets(docsDir, distDir) {
    // Copy assets directory (CSS, JS, images)
    if (
      this.#copyDir(
        this.#path.join(docsDir, "assets"),
        this.#path.join(distDir, "assets"),
      )
    ) {
      console.log("  ✓ assets/");
    }

    // Copy public files (favicon, etc.)
    const publicDir = this.#path.join(docsDir, "public");
    if (!this.#fs.existsSync(publicDir)) return;

    this.#fs
      .readdirSync(publicDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .forEach((entry) => {
        this.#fs.copyFileSync(
          this.#path.join(publicDir, entry.name),
          this.#path.join(distDir, entry.name),
        );
        console.log(`  ✓ ${entry.name}`);
      });
  }

  /**
   * Build documentation from Markdown files
   * @param {string} docsDir - Source documentation directory
   * @param {string} distDir - Destination distribution directory
   * @returns {Promise<void>}
   */
  async build(docsDir, distDir) {
    console.log("Building documentation...");

    // Clean and create dist directory
    if (this.#fs.existsSync(distDir)) {
      this.#fs.rmSync(distDir, { recursive: true });
    }
    this.#fs.mkdirSync(distDir, { recursive: true });

    // Read and validate template
    const templatePath = this.#path.join(docsDir, "template.html.mustache");
    if (!this.#fs.existsSync(templatePath)) {
      throw new Error("template.html.mustache not found in docs directory");
    }
    const template = this.#fs.readFileSync(templatePath, "utf-8");

    // Process each Markdown file
    const mdFiles = this.#fs
      .readdirSync(docsDir)
      .filter((file) => file.endsWith(".md"));

    if (mdFiles.length === 0) {
      console.warn("Warning: No Markdown files found in docs/");
    }

    for (const mdFile of mdFiles) {
      const { data: frontMatter, content: markdown } = this.#matter(
        this.#fs.readFileSync(this.#path.join(docsDir, mdFile), "utf-8"),
      );

      if (!frontMatter.title) {
        console.error(`Error: Missing 'title' in front matter of ${mdFile}`);
        continue;
      }

      // Convert Markdown to HTML
      const html = this.#marked(markdown);
      const toc = frontMatter.toc ? this.#generateToc(html) : "";

      // Render template with context
      const outputHtml = this.#mustacheRender(template, {
        title: frontMatter.title,
        description: frontMatter.description || "",
        content: html,
        toc,
        hasToc: !!toc,
      });

      // Format HTML with prettier
      const formattedHtml = await this.#prettier.format(outputHtml, {
        parser: "html",
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
      });

      // Post-process: Unescape HTML entities in Mermaid code blocks
      // Prettier escapes entities, but Mermaid.js needs raw syntax
      let finalHtml = formattedHtml;
      const mermaidBlocks = formattedHtml.match(
        /<code class="language-mermaid">[\s\S]*?<\/code>/g,
      );
      if (mermaidBlocks) {
        finalHtml = formattedHtml.replace(
          /<code class="language-mermaid">([\s\S]*?)<\/code>/g,
          (_match, code) => {
            const unescapedCode = code
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            return `<code class="language-mermaid">${unescapedCode}</code>`;
          },
        );
      }

      // Write output file (index.md → index.html, example.md → example/index.html)
      const baseName = mdFile.replace(".md", "");
      const isIndex = baseName === "index";
      const outputDir = isIndex ? distDir : this.#path.join(distDir, baseName);

      this.#fs.mkdirSync(outputDir, { recursive: true });
      this.#fs.writeFileSync(
        this.#path.join(outputDir, "index.html"),
        finalHtml,
        "utf-8",
      );
      console.log(`  ✓ ${isIndex ? "index.html" : `${baseName}/index.html`}`);
    }

    this.#copyStaticAssets(docsDir, distDir);
    console.log("Documentation build complete!");
  }
}
