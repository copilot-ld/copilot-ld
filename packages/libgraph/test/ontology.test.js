/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { DataFactory } from "n3";

import { OntologyProcessor } from "../processor/ontology.js";
import { ShaclSerializer } from "../serializer.js";

const { namedNode, literal } = DataFactory;

describe("OntologyProcessor", () => {
  let processor;
  let serializer;

  beforeEach(() => {
    processor = new OntologyProcessor();
    serializer = new ShaclSerializer();
  });

  describe("constructor", () => {
    test("creates OntologyProcessor instance", () => {
      assert.ok(processor instanceof OntologyProcessor);
    });
  });

  describe("process", () => {
    test("handles null quad gracefully", () => {
      processor.process(null);
      const data = processor.getData();
      const output = serializer.serialize(data);
      assert.ok(typeof output === "string");
    });

    test("processes rdf:type assertion", () => {
      const quad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      processor.process(quad);
      const data = processor.getData();
      const output = serializer.serialize(data);

      assert.ok(output.includes("http://schema.org/Person"));
      assert.ok(output.includes("sh:targetClass"));
    });

    test("processes property assertions", () => {
      // First add a type assertion
      const typeQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      // Then add a property
      const propQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://schema.org/name"),
        object: literal("John Doe"),
      };

      processor.process(typeQuad);
      processor.process(propQuad);

      const data = processor.getData();
      const output = serializer.serialize(data);

      assert.ok(output.includes("http://schema.org/Person"));
      assert.ok(output.includes("http://schema.org/name"));
    });

    test("tracks object types for predicates", () => {
      // Define two people
      const person1Type = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      const person2Type = {
        subject: namedNode("http://example.org/person/2"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      // Person 1 knows Person 2
      const knowsQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://schema.org/knows"),
        object: namedNode("http://example.org/person/2"),
      };

      processor.process(person1Type);
      processor.process(person2Type);
      processor.process(knowsQuad);

      const data = processor.getData();
      const output = serializer.serialize(data);

      assert.ok(output.includes("http://schema.org/knows"));
      assert.ok(output.includes("sh:class"));
    });

    test("ignores quads without subject", () => {
      const quad = {
        subject: null,
        predicate: namedNode("http://schema.org/name"),
        object: literal("John Doe"),
      };

      processor.process(quad);
      const data = processor.getData();
      const output = serializer.serialize(data);

      // Should produce empty or minimal output
      assert.ok(typeof output === "string");
    });

    test("ignores quads without predicate", () => {
      const quad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: null,
        object: literal("John Doe"),
      };

      processor.process(quad);
      const data = processor.getData();
      const output = serializer.serialize(data);

      // Should produce empty or minimal output
      assert.ok(typeof output === "string");
    });

    test("processes multiple classes", () => {
      const personType = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      const orgType = {
        subject: namedNode("http://example.org/org/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Organization"),
      };

      processor.process(personType);
      processor.process(orgType);

      const data = processor.getData();
      const output = serializer.serialize(data);

      assert.ok(output.includes("http://schema.org/Person"));
      assert.ok(output.includes("http://schema.org/Organization"));
    });

    test("handles literal objects", () => {
      const typeQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      const literalQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://schema.org/name"),
        object: literal("John Doe"),
      };

      processor.process(typeQuad);
      processor.process(literalQuad);

      const data = processor.getData();
      const output = serializer.serialize(data);

      // Should include the property even though object is literal
      assert.ok(output.includes("http://schema.org/name"));
    });
  });

  describe("getData", () => {
    test("produces valid Turtle output", () => {
      const typeQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      processor.process(typeQuad);
      const data = processor.getData();
      const output = serializer.serialize(data);

      // Should contain SHACL prefixes
      assert.ok(output.includes("@prefix"));
      assert.ok(output.includes("sh:"));
    });

    test("produces empty string for empty processor", () => {
      const data = processor.getData();
      const output = serializer.serialize(data);

      // Should handle empty state gracefully
      assert.ok(typeof output === "string");
    });

    test("includes shape metadata", () => {
      const typeQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      processor.process(typeQuad);
      const data = processor.getData();
      const output = serializer.serialize(data);

      assert.ok(output.includes("sh:NodeShape"));
      assert.ok(output.includes("sh:targetClass"));
    });

    test("orders classes by instance count", () => {
      // Create multiple instances of Person
      for (let i = 1; i <= 3; i++) {
        processor.process({
          subject: namedNode(`http://example.org/person/${i}`),
          predicate: namedNode(
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          ),
          object: namedNode("http://schema.org/Person"),
        });
      }

      // Create one instance of Organization
      processor.process({
        subject: namedNode("http://example.org/org/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Organization"),
      });

      const data = processor.getData();
      const output = serializer.serialize(data);

      // Person should appear before Organization in output
      const personIndex = output.indexOf("http://schema.org/Person");
      const orgIndex = output.indexOf("http://schema.org/Organization");

      assert.ok(personIndex >= 0);
      assert.ok(orgIndex >= 0);
      assert.ok(personIndex < orgIndex);
    });

    test("returns data with required properties", () => {
      const typeQuad = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      processor.process(typeQuad);
      const data = processor.getData();

      assert.ok(data.typeInstances instanceof Map);
      assert.ok(data.typeProperties instanceof Map);
      assert.ok(data.propertyObjectTypes instanceof Map);
      assert.ok(data.typeExamples instanceof Map);
      assert.ok(data.entityNames instanceof Map);
    });

    test("tracks property object types", () => {
      // Create two people with relationship
      const person1Type = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      const person2Type = {
        subject: namedNode("http://example.org/person/2"),
        predicate: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        object: namedNode("http://schema.org/Person"),
      };

      // Person 1 knows Person 2
      const knows1to2 = {
        subject: namedNode("http://example.org/person/1"),
        predicate: namedNode("http://schema.org/knows"),
        object: namedNode("http://example.org/person/2"),
      };

      processor.process(person1Type);
      processor.process(person2Type);
      processor.process(knows1to2);

      const data = processor.getData();

      // Should track property object types
      assert.ok(data.propertyObjectTypes instanceof Map);
      assert.ok(data.propertyObjectTypes.has("http://schema.org/knows"));
    });
  });
});
