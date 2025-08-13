/* eslint-env node */
import path from "path";

import { ChunkIndex } from "@copilot-ld/libchunk";
import { ToolConfig } from "@copilot-ld/libconfig";
import { Copilot } from "@copilot-ld/libcopilot";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";
import { VectorProcessor } from "@copilot-ld/libvector/processor.js";

// Cofnfiguration
const config = new ToolConfig("index");
const CHUNKS_DIR = config.storagePath("chunks");
const SCOPE_DIR = config.storagePath("scope");
const VECTORS_DIR = config.storagePath("vectors");

const SCOPES = ["capability", "policy", "service", "process"];

const SCOPE_TRAINING_DATA = {
  capability: [
    "software development programming coding skill level awareness working practitioner expert",
    "application development mobile web backend frontend fullstack skill proficiency",
    "cloud computing aws azure gcp kubernetes docker containerization skill level",
    "devops automation ci cd pipeline deployment infrastructure skill expertise",
    "security cybersecurity application security network security skill competency",
    "data engineering analytics machine learning ai skill proficiency level",
    "project management agile scrum kanban leadership skill experience",
    "testing quality assurance automation manual testing skill level",
    "database design sql nosql data modeling skill proficiency",
    "system architecture microservices distributed systems skill expertise level",
    "user experience design ui ux research prototyping skill competency",
    "technical writing documentation communication skill proficiency",
    "software engineering practices code review mentoring skill level expertise",
    "platform engineering site reliability engineering sre skill competency",
    "product management product ownership stakeholder management skill level",
  ],
  policy: [
    "planning phase policy requirements gathering security review architecture approval",
    "development policy code standards secure coding guidelines peer review mandatory",
    "building phase policy build automation security scanning dependency checking",
    "testing policy security testing penetration testing vulnerability assessment quality gates",
    "code review policy approval process security validation compliance checking",
    "release policy deployment approval change management production readiness",
    "monitoring policy logging security monitoring incident response alerting",
    "data protection policy encryption at rest in transit classification handling",
    "access control policy authentication authorization role based permissions",
    "compliance policy regulatory requirements audit trails documentation standards",
    "vulnerability management policy scanning remediation timelines security patches",
    "software delivery lifecycle policy quality assurance security integration",
    "organizational governance policy risk management security frameworks standards",
    "change management policy approval workflows deployment gates rollback procedures",
    "incident response policy security breaches disaster recovery business continuity",
  ],
  service: [
    "policy management service automated enforcement centralized repository opa compliance",
    "testing automation service functional api salesforce web mobile application quality",
    "analytics dashboard service tableau data visualization reporting business intelligence",
    "data consolidation service customer unified view integration reltio master data",
    "process analytics service workflow metrics lead time throughput flow efficiency",
    "authentication service identity management sso oauth ldap access control",
    "monitoring service logging alerting metrics observability performance health",
    "deployment service ci cd pipeline automated release infrastructure orchestration",
    "backup service data protection disaster recovery business continuity storage",
    "security service vulnerability scanning threat detection compliance audit",
    "database service sql nosql data storage replication performance optimization",
    "messaging service event streaming notification integration communication",
    "api gateway service routing load balancing rate limiting transformation",
    "configuration service environment management secrets vault feature flags",
    "documentation service knowledge base wiki collaboration content management",
  ],
  process: [
    "lead time cycle time process behavior chart control limits statistical analysis",
    "process control chart natural limits sigma bounds upper lower thresholds",
    "speed metrics performance measurement throughput velocity delivery time",
    "control limits statistical process control spc variation special cause common",
    "process signals large change moderate sustained shift pattern detection",
    "xmr chart individual moving range measurement statistical quality control",
    "cycle time measurement workflow duration average median percentile distribution",
    "process behavior analysis trend monitoring performance baseline variance",
    "signal detection upper bound lower bound threshold violation alert",
    "process improvement metrics optimization efficiency effectiveness measurement",
    "statistical analysis variation measurement process capability stability",
    "performance indicator kpi metric dashboard monitoring tracking trending",
    "process monitoring measurement system control chart analysis interpretation",
    "quality metric measurement process performance operational excellence",
    "workflow analytics lead time analysis process flow measurement tracking",
  ],
};

/**
 * Main function to process chunks for indexing by creating scope classification
 * index and processing all chunks into scope-specific vector indices
 * @returns {Promise<void>}
 */
async function main() {
  const chunksStorage = storageFactory(CHUNKS_DIR, config);
  const scopeStorage = storageFactory(SCOPE_DIR, config);

  const scopeIndex = new VectorIndex(scopeStorage);

  const vectorIndices = {};
  for (const scope of SCOPES) {
    const scopeVectorStorage = storageFactory(
      path.join(VECTORS_DIR, scope),
      config,
    );
    vectorIndices[scope] = new VectorIndex(scopeVectorStorage);
  }

  const chunkIndex = new ChunkIndex(chunksStorage);
  const client = new Copilot(config.githubToken());
  const logger = logFactory("index-tool");

  const processor = new VectorProcessor(
    scopeIndex,
    vectorIndices,
    chunkIndex,
    client,
    logger,
  );

  await processor.train(SCOPE_TRAINING_DATA);
  await processor.process();
  await processor.persist();

  console.log("\nIndexing completed successfully!");
}

main();
