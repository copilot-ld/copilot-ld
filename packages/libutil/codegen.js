/* eslint-env node */
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

import { CodegenInterface } from "./types.js";

/**
 * Code generation utility for protobuf-based services and types
 * Implements object-oriented approach with dependency injection
 */
export class Codegen extends CodegenInterface {
  #projectRoot;
  #path;
  #mustache;
  #protoLoader;
  #fs;

  /**
   * Creates a new codegen instance with dependency injection
   * @param {string} projectRoot - Project root directory path
   * @param {object} path - Path module for file operations
   * @param {object} mustache - Mustache template rendering module
   * @param {object} protoLoader - Protocol buffer loader module
   * @param {object} fs - File system module (sync operations only)
   */
  constructor(projectRoot, path, mustache, protoLoader, fs) {
    super();
    if (!projectRoot) throw new Error("projectRoot is required");
    if (!path) throw new Error("path module is required");
    if (!mustache) throw new Error("mustache module is required");
    if (!protoLoader) throw new Error("protoLoader module is required");
    if (!fs) throw new Error("fs module is required");

    this.#projectRoot = projectRoot;
    this.#path = path;
    this.#mustache = mustache;
    this.#protoLoader = protoLoader;
    this.#fs = fs;
  }

  // High-level operations (main entry points)

  /** @inheritdoc */
  async runTypes(generatedPath) {
    if (!generatedPath) throw new Error("generatedPath is required");
    const typesDir = this.#path.resolve(generatedPath, "types");
    const protoOutDir = this.#path.resolve(generatedPath, "proto");
    const jsOutFile = this.#path.resolve(typesDir, "types.js");

    // Create directories and clean up existing files
    [typesDir, protoOutDir].forEach((dir) => {
      this.#fs.mkdirSync(dir, { recursive: true });
    });

    if (this.#fs.existsSync(jsOutFile)) {
      this.#fs.unlinkSync(jsOutFile);
    }

    const protoFiles = this.collectProtoFiles({ includeTools: true });

    // Copy all proto source files into generated/proto for runtime loading
    protoFiles.forEach((protoFile) => {
      this.#fs.copyFileSync(
        protoFile,
        this.#path.resolve(protoOutDir, this.#path.basename(protoFile)),
      );
    });

    await this.generateJavaScriptTypes(protoFiles, jsOutFile);

    // ESM resolution fix: ensure explicit extension for Node ESM and default import
    const content = this.#fs.readFileSync(jsOutFile, "utf8");
    const fixed = content
      .replace(/from\s+"protobufjs\/minimal";/, 'from "protobufjs/minimal.js";')
      .replace(
        /import\s+\*\s+as\s+\$protobuf\s+from\s+"protobufjs\/minimal\.js";/,
        'import $protobuf from "protobufjs/minimal.js";',
      );

    if (fixed !== content) {
      this.#fs.writeFileSync(jsOutFile, fixed, "utf8");
    }
  }

  /** @inheritdoc */
  async runForKind(kind, generatedPath) {
    if (!generatedPath) throw new Error("generatedPath is required");
    const protoFiles = this.collectProtoFiles({ includeTools: true }).filter(
      (file) => !file.endsWith(this.#path.sep + "common.proto"),
    );

    for (const protoFile of protoFiles) {
      const basename = this.#path.basename(protoFile, ".proto");
      const outDir = this.#path.join(generatedPath, "services", basename);
      this.#fs.mkdirSync(outDir, { recursive: true });
      await this.#generateArtifact(kind, protoFile, outDir);
    }
  }

  /** @inheritdoc */
  async runServicesExports(generatedPath) {
    if (!generatedPath) throw new Error("generatedPath is required");
    const serviceDir = this.#path.join(generatedPath, "services");
    const outputFile = this.#path.join(serviceDir, "exports.js");

    this.#fs.mkdirSync(this.#path.dirname(outputFile), { recursive: true });

    const services = [];
    const clients = [];

    if (this.#fs.existsSync(serviceDir)) {
      for (const dir of this.#fs.readdirSync(serviceDir)) {
        const servicePath = this.#path.join(serviceDir, dir);
        if (!this.#fs.statSync(servicePath).isDirectory()) continue;

        const serviceName = this.#pascalCase(dir);
        if (this.#fs.existsSync(this.#path.join(servicePath, "service.js"))) {
          services.push({
            name: `${serviceName}Base`,
            path: `./${dir}/service.js`,
          });
        }
        if (this.#fs.existsSync(this.#path.join(servicePath, "client.js"))) {
          clients.push({
            name: `${serviceName}Client`,
            path: `./${dir}/client.js`,
          });
        }
      }
    }

    const content = this.#mustache.render(this.#loadTemplate("exports"), {
      services,
      clients,
      hasServices: services.length > 0,
      hasClients: clients.length > 0,
    });

    this.#fs.writeFileSync(outputFile, content);
  }

  // Mid-level operations (core generation functions)

  /** @inheritdoc */
  async generateJavaScriptTypes(protoFiles, outFile) {
    const args = [
      "-t",
      "static-module",
      "-w",
      "es6",
      "--no-delimited",
      "--no-create",
      "--no-service",
      "--force-message",
      "--keep-case",
      "-o",
      outFile,
      ...protoFiles,
    ];

    await this.#run("npx", ["pbjs", ...args], { cwd: this.#projectRoot });
  }

  // Low-level utilities (helper functions)

  /** @inheritdoc */
  collectProtoFiles(opts = {}) {
    const { includeTools = true } = opts;
    const protoDir = this.#path.join(this.#projectRoot, "proto");

    const discovered = this.#fs
      .readdirSync(protoDir)
      .filter((f) => f.endsWith(".proto"))
      .sort();

    const ordered = discovered.includes("common.proto")
      ? [
          this.#path.join(protoDir, "common.proto"),
          ...discovered
            .filter((f) => f !== "common.proto")
            .map((f) => this.#path.join(protoDir, f)),
        ]
      : discovered.map((f) => this.#path.join(protoDir, f));

    if (includeTools) {
      try {
        ordered.push(
          ...this.#fs
            .readdirSync(this.#path.join(this.#projectRoot, "tools"))
            .filter((f) => f.endsWith(".proto"))
            .map((f) => this.#path.join(this.#projectRoot, "tools", f)),
        );
      } catch {
        // tools directory may not exist; ignore
      }
    }

    return ordered;
  }

  // Private helper methods (implementation details)

  /**
   * Load mustache template for given kind (service|client|exports)
   * @param {"service"|"client"|"exports"} kind - Template kind
   * @returns {string} Template content
   * @private
   */
  #loadTemplate(kind) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = this.#path.dirname(__filename);
    const templatePath = this.#path.join(
      __dirname,
      "templates",
      `${kind}.js.mustache`,
    );

    if (!this.#fs.existsSync(templatePath)) {
      throw new Error(`Missing ${kind}.js.mustache template`);
    }
    return this.#fs.readFileSync(templatePath, "utf8");
  }

  /**
   * Run a command with arguments and options
   * @param {string} cmd - Command to execute
   * @param {string[]} args - Command-line arguments
   * @param {object} [opts] - Child process options
   * @returns {Promise<void>} Resolves when the command completes successfully
   * @private
   */
  #run(cmd, args, opts = {}) {
    return new Promise((resolvePromise, reject) => {
      const child = execFile(
        cmd,
        args,
        { stdio: "inherit", ...opts },
        (err) => {
          if (err) reject(err);
          else resolvePromise();
        },
      );
      child.on("error", reject);
    });
  }

  /**
   * Convert string to PascalCase
   * @param {string} str - String to convert
   * @returns {string} PascalCase string
   * @private
   */
  #pascalCase(str) {
    return str
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  /**
   * Parse a .proto file to extract a single service definition and method shapes
   * @param {string} protoPath - Absolute path to .proto file
   * @returns {{packageName:string, serviceName:string, methods:Array, namespaceName:string}|null} Parsed service info
   * @private
   */
  #parseProtoFile(protoPath) {
    const def = this.#protoLoader.loadSync(protoPath, {
      includeDirs: [this.#path.dirname(protoPath)],
      keepCase: true,
    });

    const serviceKey = Object.keys(def).find((key) => {
      const val = def[key];
      if (!val || typeof val !== "object") return false;
      const methods = Object.values(val);
      return (
        methods.length > 0 &&
        methods.every(
          (m) =>
            m &&
            typeof m === "object" &&
            "requestType" in m &&
            "responseType" in m,
        )
      );
    });

    if (!serviceKey) return null; // Indicate no service for this proto (pure message proto)

    const serviceDef = def[serviceKey];
    const parts = serviceKey.split(".");
    const serviceName = parts[parts.length - 1];
    const packageName = parts.slice(0, -1).join(".");

    const methods = Object.entries(serviceDef).map(
      ([name, method], index, array) => {
        const req = method.requestType.type;
        const res = method.responseType.type;

        return {
          name,
          requestType: req.name,
          responseType: res.name,
          requestTypeNamespace: this.#findTypeNamespace(req, def, packageName),
          responseTypeNamespace: this.#findTypeNamespace(res, def, packageName),
          paramName: "req",
          isLast: index === array.length - 1,
        };
      },
    );

    // Collect all unique namespaces needed for imports
    const namespaces = new Set([
      packageName,
      ...methods.flatMap((m) => [
        m.requestTypeNamespace,
        m.responseTypeNamespace,
      ]),
    ]);

    return {
      packageName,
      serviceName,
      methods,
      namespaceName: packageName,
      importNamespaces: Array.from(namespaces).map((ns, index, array) => ({
        name: ns,
        isLast: index === array.length - 1,
      })),
    };
  }

  /**
   * Find the namespace for a given type by comparing structure
   * @param {object} typeToFind - The type definition to find namespace for
   * @param {object} allTypes - All available type definitions
   * @param {string} fallbackPackage - Fallback package name
   * @returns {string} The namespace string for the type
   * @private
   */
  #findTypeNamespace(typeToFind, allTypes, fallbackPackage) {
    // Find matching type definition by structure comparison
    for (const [key, typeDef] of Object.entries(allTypes)) {
      if (typeDef.type && typeDef.type.name === typeToFind.name) {
        const typeFields = typeDef.type.field || [];
        const targetFields = typeToFind.field || [];

        // Compare fields to see if structures match
        const fieldsMatch =
          typeFields.length === targetFields.length &&
          typeFields.every(
            (field, i) =>
              field.name === targetFields[i].name &&
              field.type === targetFields[i].type &&
              field.typeName === targetFields[i].typeName,
          );

        if (fieldsMatch) {
          const parts = key.split(".");
          return parts.length > 1
            ? parts.slice(0, -1).join(".")
            : fallbackPackage;
        }
      }
    }
    return fallbackPackage;
  }

  /**
   * Render and write a service/client artifact for a given proto into a service dir
   * @param {"service"|"client"} kind - Artifact kind to generate
   * @param {string} protoPath - Absolute path to .proto file
   * @param {string} outputDir - Absolute directory path for output
   * @returns {Promise<void>}
   * @private
   */
  async #generateArtifact(kind, protoPath, outputDir) {
    const parsed = this.#parseProtoFile(protoPath);
    if (!parsed) return; // Skip non-service proto

    const {
      packageName,
      serviceName,
      methods,
      namespaceName,
      importNamespaces,
    } = parsed;
    const rendered = this.#mustache.render(this.#loadTemplate(kind), {
      packageName,
      serviceName,
      methods,
      namespaceName,
      importNamespaces,
      className: `${serviceName}${kind === "service" ? "Base" : "Client"}`,
    });

    const jsFile = this.#path.join(outputDir, `${kind}.js`);
    this.#fs.writeFileSync(jsFile, rendered);
  }
}
