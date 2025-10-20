---
title: Copilot-LD
description: |
  Traditional RAG systems treat knowledge as plain text, leading to responses
  based on text similarity rather than actual meaning. Copilot-LD is different:
  it uses structured linked data to understand <em>relationships and
  context</em>, delivering responses grounded in your knowledge graph—not just
  matching keywords.
toc: false
---

## Key Features

<div class="grid">
<article>

### 🎯 Amazingly <mark>Accurate</mark>

Semantic understanding through linked data preserves relationships and context.
Content chunks align with meaning, not arbitrary character limits. Dual-index
search finds both content and purpose.

</article>

<article>

### ⚡️ Incredibly <mark>Fast</mark>

In-memory vector operations eliminate API latency. Pre-computed embeddings mean
zero runtime API cost. Parallel processing and optimized indexes deliver
sub-second responses.

</article>
</div>

<div class="grid">
<article>

### 🛡️ Robustly <mark>Secure</mark>

Network-isolated backend services with HMAC authentication. Policy-based access
control for all resources. Minimal container images (under 10 MB) reduce attack
surface. Time-limited tokens prevent replay attacks.

</article>

<article>

### ✨ Elegantly <mark>Simple</mark>

Plain JavaScript with zero external dependencies beyond Node.js built-ins. No
framework complexity or deployment woes. Easy to understand, audit, and operate.
Everything in only 6,000 lines of clean code.

</article>
</div>

## What Can You Build?

<div class="grid">
<article>

### 🚀 Autonomous <mark>Agents</mark>

Create intelligent agents that autonomously select and execute tools to
accomplish complex tasks. The agent analyzes requests, determines which tools to
invoke, and chains multiple operations together—all without manual intervention.

</article>

<article>

### 🧠 Knowledge Graph <mark>Explorers</mark>

Navigate organizational knowledge through graph queries that traverse
relationships between entities. Discover connections, hierarchies, and
dependencies using RDF triple patterns to uncover insights hidden in your data.

</article>
</div>

<div class="grid">
<article>

### 🧩 Decision Support <mark>Systems</mark>

Build systems that combine graph traversal with semantic search to analyze
policies, procedures, and relationships. Agents automatically gather relevant
information, evaluate constraints, and provide reasoned recommendations.

</article>

<article>

### 🎬 Workflow <mark>Automation</mark>

Deploy agents that understand your processes and autonomously execute multi-step
workflows. They query knowledge graphs to understand dependencies, invoke
appropriate tools, and adapt to changing conditions.

</article>
</div>

## Getting Started

Get started with our step-by-step guides:

1. [Configuration Guide](/configuration/) - Set up environment variables and
   YAML configuration
2. [Processing Guide](/processing/) - Transform HTML knowledge into searchable
   resources
3. [Deployment Guide](/deployment/) - Launch with Docker Compose or AWS
   CloudFormation
4. [Development Guide](/development/) - Run locally with live reloading

Ready to dive deeper?

1. [Concepts](/concepts/) – Understand linked data, RAG, and architectural
   decisions
2. [Architecture](/architecture/) – Explore system structure and communication
   patterns
3. [Reference](/reference/) – Detailed service implementations and package APIs
