/**
 * Mock git repository structure for testing
 */

export const gitDiffOutputs = {
  multiplePackages:
    "packages/libconfig/index.js\npackages/librpc/test.js\nservices/agent/service.js\nREADME.md",
  singlePackage: "packages/libconfig/index.js\npackages/libconfig/types.js",
  noPackages: "README.md\ndocs/architecture.html",
  empty: "",
  extensionsOnly: "extensions/web/index.js\nextensions/teams/types.js",
  toolsOnly: "scripts/search.js\nscripts/embed.js",
};

export const directoryStructures = {
  standard: {
    packages: [
      { name: "libconfig", isDirectory: () => true },
      { name: "librpc", isDirectory: () => true },
      { name: "libvector", isDirectory: () => true },
    ],
    services: [
      { name: "agent", isDirectory: () => true },
      { name: "vector", isDirectory: () => true },
    ],
    extensions: [
      { name: "web", isDirectory: () => true },
      { name: "copilot", isDirectory: () => true },
    ],
    tools: [],
  },

  minimal: {
    packages: [{ name: "libconfig", isDirectory: () => true }],
    services: [],
    extensions: [],
    tools: [],
  },

  complex: {
    packages: [
      { name: "libconfig", isDirectory: () => true },
      { name: "librpc", isDirectory: () => true },
      { name: "libvector", isDirectory: () => true },
      { name: "libweb", isDirectory: () => true },
    ],
    services: [
      { name: "agent", isDirectory: () => true },
      { name: "vector", isDirectory: () => true },
      { name: "history", isDirectory: () => true },
      { name: "llm", isDirectory: () => true },
    ],
    extensions: [
      { name: "web", isDirectory: () => true },
      { name: "copilot", isDirectory: () => true },
    ],
    tools: [],
  },
};

export const globPatterns = {
  recursive: {
    "packages/**/CHANGELOG.md": [
      "packages/libconfig/CHANGELOG.md",
      "packages/librpc/CHANGELOG.md",
    ],
    "services/**/CHANGELOG.md": [
      "services/agent/CHANGELOG.md",
      "services/vector/CHANGELOG.md",
    ],
    "**/CHANGELOG.md": [
      "packages/libconfig/CHANGELOG.md",
      "services/agent/CHANGELOG.md",
    ],
  },

  direct: {
    "packages/libconfig/CHANGELOG.md": ["packages/libconfig/CHANGELOG.md"],
    "services/agent/CHANGELOG.md": ["services/agent/CHANGELOG.md"],
  },
};
