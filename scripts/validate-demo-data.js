#!/usr/bin/env node
/* eslint-env node */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { microdata } from "microdata-minimal";

const knowledgeDir = "examples/knowledge";
const files = readdirSync(knowledgeDir).filter((f) => f.endsWith(".html"));

console.log(`\n=== TechNova Demo Dataset Validation ===\n`);
console.log(`Testing ${files.length} HTML files...\n`);

let totalItems = 0;
const typeCounts = {};

for (const file of files) {
  const filepath = join(knowledgeDir, file);
  const html = readFileSync(filepath, "utf8");
  const items = microdata(html);

  totalItems += items.length;

  console.log(`✓ ${file}`);
  console.log(`  Items: ${items.length}`);

  // Count types
  items.forEach((item) => {
    // Handle both @type (JSON-LD) and type properties
    const typeValue = item["@type"] || item.type;
    const types = Array.isArray(typeValue) ? typeValue : [typeValue];
    types.forEach((type) => {
      const typeName = type || "unknown";
      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
    });
  });

  // Show sample types for first few items
  if (items.length > 0) {
    const types = items.slice(0, 3).map((i) => {
      const t = i["@type"] || i.type;
      const typeName = Array.isArray(t) ? t[0] : t;
      return typeName || "unknown";
    });
    console.log(`  Types: ${types.join(", ")}`);
  }
  console.log();
}

console.log(`=== Summary ===\n`);
console.log(`Total Files: ${files.length}`);
console.log(`Total Microdata Items: ${totalItems}`);
console.log(`\nItem Type Distribution:`);

Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    const shortType = type.replace("https://schema.org/", "");
    console.log(`  ${shortType}: ${count}`);
  });

console.log(`\n✓ All files processed successfully!\n`);
