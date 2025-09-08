# Tools Directory

This directory contains **optional protobuf definitions and their services for custom tools** that **extend the core Copilot-LD system**. These tools are not part of the core platform but provide additional functionality that can be integrated with the Tool service.

## Tool Architecture

The Tool service supports two approaches for defining tools that **extend the core system**:

### 1. Mapping to Existing Services (Recommended)

Tools can be mapped to existing gRPC service methods through configuration in
`config.yml`. This approach requires no additional proto files and leverages
existing service implementations.

**Example**: A vector search tool can map to the existing `vector.QueryItems`
method:

```yaml
service:
  tool:
    endpoints:
      vector_search:
        call: "vector.Vector.QueryItems"
        name: "search_similar_content"
        description: "Search for similar content using vector embeddings"
```

### 2. Custom Tool Services (Optional)

For new functionality that doesn't exist in current services, you can define
**custom tool protobuf files in this directory that extend the platform**. These files will be included in
the type generation process and can be implemented as standalone services that integrate with the core system.

**Example**: The `hash.proto` file defines custom hashing tools:

```proto
syntax = "proto3";

package hash;

service Hash {
  rpc Sha256(HashRequest) returns (HashResponse);
  rpc Md5(HashRequest) returns (HashResponse);
}

message HashRequest {
  string input = 1;
}

message HashResponse {
  string hash = 1;
  string algorithm = 2;
}
```

## Example Implementation

A complete working example is available in `examples/tools/hash/` which demonstrates how to **extend the platform** with custom tools:

- **Protocol Definition**: `hash.proto` with `Hash` service and `Sha256`/`Md5` methods
- **Service Implementation**: `index.js` with `HashService` class extending the generated base
- **Server Bootstrap**: `server.js` showing how to start the service
- **Package Configuration**: `package.json` with proper dependencies and scripts

This example implements a simple hash service using Node.js built-in crypto module and can be used as a template for creating custom tool services that extend the core platform.

## Type Generation

Proto files in this directory are automatically included in the type generation
process when running:

```bash
npm run codegen:type
```

**Note**: These tool definitions **extend the core system** and are processed separately from the main platform protobuf schemas in `/proto`.

## Tool Registration

Tools are registered and made available to LLMs through:

1. Configuration mapping in `config.yml`
2. Resource generation via `scripts/tools.js`
3. Resource storage in the ResourceIndex
4. Dynamic discovery through the Tool service

## Getting Started

1. **For existing service mapping**: Add configuration to `config.yml` under
   `service.tool.endpoints`
2. **For custom tools that extend the platform**: Create a `.proto` file in this directory and implement
   the corresponding service
3. Run `npm run codegen` to generate types and service bases
4. Run `scripts/tools.js` to generate and store tool resources
5. Configure the tool mapping in `config.yml`
