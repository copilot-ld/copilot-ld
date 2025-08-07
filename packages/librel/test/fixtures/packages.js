/* eslint-env node */

/**
 * Test fixtures for package.json file content in tests
 */

export const packageFixtures = {
  libconfig: {
    name: "@copilot-ld/libconfig",
    version: "0.1.0",
    dependencies: {},
  },

  libservice: {
    name: "@copilot-ld/libservice",
    version: "0.1.0",
    dependencies: {
      "@copilot-ld/libconfig": "^0.1.0",
    },
  },

  agent: {
    name: "@copilot-ld/agent",
    version: "0.1.0",
    dependencies: {
      "@copilot-ld/libservice": "^0.1.0",
    },
  },
};

/**
 * Helper function to set up mock file contents for tests
 * @param {Map} fileContents - The fileContents map to populate
 * @param {object} packageSetup - Object mapping paths to package names
 */
export function setupMockPackages(fileContents, packageSetup) {
  for (const [path, packageName] of Object.entries(packageSetup)) {
    const packageData = packageFixtures[packageName];
    if (!packageData) {
      throw new Error(`Unknown package fixture: ${packageName}`);
    }
    fileContents.set(path, JSON.stringify(packageData));
  }
}
