# libcodegen

Protocol Buffer code generation utilities that transform .proto files into
JavaScript types, services, and definitions.

## Usage

```javascript
import { TypeGenerator, ServiceGenerator } from "@copilot-ld/libcodegen";

const typeGen = new TypeGenerator(protoDir);
await typeGen.generate(outputDir);
```

## API

| Export                | Description                        |
| --------------------- | ---------------------------------- |
| `CodeGenerator`       | Base code generation functionality |
| `TypeGenerator`       | Type generation from protos        |
| `ServiceGenerator`    | Service stub generation            |
| `DefinitionGenerator` | Definition generation              |
