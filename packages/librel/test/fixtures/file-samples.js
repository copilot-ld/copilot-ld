/**
 * Test fixtures for CHANGELOG.md content in tests
 */

export const changelogFixtures = {
  empty: "",

  basic: `# Changelog

## 2025-08-01

- Initial release
`,

  multipleEntries: `# Changelog

## 2025-08-01

- Initial release
- Added basic functionality

## 2025-08-02

- Bug fixes
- Performance improvements
`,

  withExistingDate: `# Changelog

## 2025-08-08

- Existing change for today
`,

  chronologicalOrder: `# Changelog

## 2025-08-01

- First change

## 2025-08-05

- Middle change

## 2025-08-10

- Latest change
`,

  noHeader: `## 2025-08-01

- Some change without header
`,
};

export const packageJsonFixtures = {
  libconfig: {
    name: "@copilot-ld/libconfig",
    version: "0.1.0",
    dependencies: {},
  },

  librpc: {
    name: "@copilot-ld/librpc",
    version: "0.1.0",
    dependencies: {
      "@copilot-ld/libconfig": "^0.1.0",
    },
  },

  agent: {
    name: "@copilot-ld/agent",
    version: "0.1.0",
    dependencies: {
      "@copilot-ld/librpc": "^0.1.0",
    },
  },
};
