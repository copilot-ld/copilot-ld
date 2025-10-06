# Tools Directory

This directory contains optional protobuf definitions for custom tools that can
be used with the Tool service.

## Tool Architecture

The Tool service supports two approaches for defining tools:

### 1. Mapping to Existing Services (Recommended)

Tools can be mapped to existing gRPC service methods through configuration in
`config/config.json`. This approach requires no additional proto files and leverages
existing service implementations.

**Example**: A SHA-256 hash tool can map to the existing `hash.Hash.Sha256`
method in `config/config.json`:

```json
{
  "service": {
    "tool": {
      "endpoints": {
        "sha256_hash": {
          "method": "hash.Hash.Sha256",
          "request": "hash.HashRequest"
        }
      }
    }
  }
}
```

Tool descriptions and documentation are managed separately in `config/tools.yml`.

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

## Tool Registration

Tools are registered and made available to LLMs through:

1. Endpoint mapping configuration in `config/config.json`
2. Tool descriptions and documentation in `config/tools.yml`
3. Schema and resource generation (see [Processing Guide](../docs/processing.html))
4. Dynamic discovery through the Tool service

For complete details on tool processing workflows, including schema generation and resource storage, see the [Processing Guide](../docs/processing.html).

## Getting Started

1. **For existing service mapping**: Add endpoint configuration to `config/config.json` under `service.tool.endpoints`
2. **For custom tools**: Create a `.proto` file in this directory and implement the corresponding service
3. Add tool descriptions to `config/tools.yml`
4. Follow the tool processing workflow in the [Processing Guide](../docs/processing.html)

Both approaches support the same proxy architecture and tool execution patterns through the Tool service.
