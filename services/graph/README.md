# Graph Service

Queries RDF graph data using pattern matching and retrieves ontology
information.

## Usage

```javascript
import { GraphService } from "@services/graph";

const service = new GraphService(graphIndex);
```

## API

| Method         | Description                                           |
| -------------- | ----------------------------------------------------- |
| `ListSubjects` | Retrieves all subjects, optionally filtered by type   |
| `Query`        | Queries graph using subject/predicate/object patterns |
| `GetOntology`  | Retrieves ontology.ttl content from storage           |
