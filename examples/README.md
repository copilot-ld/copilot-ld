# Examples

This directory contains example configurations and implementations to help you
get started with the platform.

## Contents

- `./knowledge/` - Example knowledge base generated with utilities in `./eval`
- `./tools/` - **Example tool implementations that extend the core Copilot-LD
  system** demonstrating how to create custom tool services and integrate them
  with the platform

## Using Example Tools

To integrate the example tools that **extend your development environment**:

```sh
cp -r ./examples/tools/* ./tools/
make codegen
```

This will copy the example tool definitions to your `tools/` directory and
generate the necessary service clients and type definitions for immediate use.

**Note**: These tools are **extensions to the core system** and provide
additional functionality beyond the base platform capabilities.
