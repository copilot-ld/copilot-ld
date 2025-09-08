# Tools Directory

This directory contains optional protobuf definitions for custom tools that can
be used with the Tool service.

## Tool Architecture

The Tool service supports two approaches for defining tools:

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
custom tool protobuf files in this directory. These files will be included in
the type generation process and can be implemented as standalone services.

**Example**: The `hash_tools.proto` file defines custom hashing tools:

```proto
syntax = "proto3";

package toolbox;

service HashTools {
  rpc Sha256Hash(HashRequest) returns (HashResponse);
  rpc Md5Hash(HashRequest) returns (HashResponse);
}

message HashRequest {
  string input = 1;
}

message HashResponse {
  string hash = 1;
  string algorithm = 2;
}
```

## Type Generation

Proto files in this directory are automatically included in the type generation
process when running:

```bash
npm run codegen:type
```

This generates TypeScript definitions in `@copilot-ld/libtype` for use
throughout the platform.

## Tool Registration

Tools are registered and made available to LLMs through:

1. Configuration mapping in `config.yml`
2. Schema generation via `scripts/tools.js`
3. Resource storage in the ResourceIndex
4. Dynamic discovery through the Tool service

## Getting Started

1. **For existing service mapping**: Add configuration to `config.yml` under
   `service.tool.endpoints`
2. **For custom tools**: Create a `.proto` file in this directory and implement
   the corresponding service
3. Run `npm run codegen` to generate types and service bases
4. Run `scripts/tools.js` to generate and store tool schemas
5. Configure the tool mapping in `config.yml`

Both approaches support the same proxy architecture and tool execution patterns
through the Tool service.
