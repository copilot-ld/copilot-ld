# Changelog

## 2025-10-10

- Added `GetOntology` RPC method to expose dataset ontology for agent query planning
- Enhanced `proto/graph.proto` with `GetOntologyRequest` and `GetOntologyResponse` messages
- Implemented ontology retrieval from storage with proper JSON handling for agent consumption
- Initial implementation of `GraphService` exposing `libgraph` functionality
- Added `QueryItems` RPC method for querying graphs by pattern
- Added `GetItem` RPC method for retrieving resources by identifier
- Created `proto/graph.proto` schema definition
- Created service bootstrap in `server.js`
