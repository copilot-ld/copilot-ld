# Copilot-LD Makefile
# ====================
# Platform automation commands. Run `make help` for usage.
#
# Environment Setup:
#   Local development:  set -a && source .env && source .env.local && source .env.storage.local && set +a
#   Docker Compose:     Uses --env-file flags directly
#
# Standard npm scripts (check, dev, format, lint, start, test) remain in package.json.

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Data Management:"
	@echo "  init              Initialize data directories"
	@echo "  clean             Remove generated data"
	@echo "  reset             Clean, init, and regenerate code"
	@echo "  download          Download demo data"
	@echo "  download-last     Download latest demo data only"
	@echo ""
	@echo "Code Generation:"
	@echo "  codegen           Generate all (types, services, clients)"
	@echo "  codegen-type      Generate types only"
	@echo "  codegen-client    Generate clients only"
	@echo "  codegen-service   Generate service bases only"
	@echo "  codegen-definition Generate definitions only"
	@echo ""
	@echo "Processing:"
	@echo "  transform         Transform documents (PDF)"
	@echo "  ingest            Load and process ingestion pipeline"
	@echo "  ingest-load       Load documents into pipeline"
	@echo "  ingest-pipeline   Run ingestion pipeline"
	@echo "  process           Process all resources"
	@echo "  process-fast      Process without vectors"
	@echo "  process-assistants Process assistant definitions"
	@echo "  process-resources Process knowledge resources"
	@echo "  process-tools     Process tool definitions"
	@echo "  process-vectors   Process vector indices"
	@echo "  process-graphs    Process graph indices"
	@echo ""
	@echo "Services:"
	@echo "  rc                Run rc command"
	@echo "  rc-start          Start services via rc"
	@echo "  rc-stop           Stop services via rc"
	@echo "  rc-restart        Restart services via rc"
	@echo "  rc-status         Show service status"
	@echo "  service-agent     Start agent with debugger"
	@echo ""
	@echo "Docker:"
	@echo "  docker            Build and start Docker Compose"
	@echo "  docker-build      Build Docker images"
	@echo "  docker-up         Start Docker Compose"
	@echo "  docker-down       Stop Docker Compose"
	@echo "  docker-upload     Upload data to MinIO"
	@echo ""
	@echo "Documentation:"
	@echo "  docs              Serve documentation"
	@echo "  docs-build        Build documentation"
	@echo "  docs-watch        Serve with live reload"
	@echo ""
	@echo "CLI Tools:"
	@echo "  cli-chat          Agent conversations"
	@echo "  cli-search        Vector similarity search"
	@echo "  cli-query         Graph triple pattern queries"
	@echo "  cli-subjects      List graph subjects by type"
	@echo "  cli-visualize     Trace visualization"
	@echo "  cli-window        Fetch memory window as JSON"
	@echo "  cli-completion    Send window to LLM API"
	@echo "  cli-tiktoken      Token counting"
	@echo "  cli-unary         Unary gRPC calls"
	@echo ""
	@echo "Evaluation:"
	@echo "  eval              Run evaluation suite"
	@echo "  eval-report       Generate evaluation report"
	@echo "  eval-reset        Reset evaluation state"
	@echo ""
	@echo "Utilities:"
	@echo "  upload            Upload data to S3"
	@echo "  download-s3       Download data from S3"
	@echo "  ontology-topdown  Generate top-down ontology"
	@echo "  security          Run security audit"
	@echo "  spellcheck        Check spelling in docs"
	@echo "  validate-html     Validate HTML output"
	@echo "  supabase-env      Generate Supabase env vars"
	@echo "  supabase-demo-user Create Supabase demo user"

# ====================
# Data Management
# ====================

.PHONY: init
init:
	@mkdir -p generated data/cli data/eval data/graphs data/ingest/in data/ingest/pipeline data/ingest/done data/memories data/policies data/resources data/traces data/vectors data/teams-tenant-configs data/teams-resource-ids data/tenants

.PHONY: clean
clean:
	@rm -rf generated data/cli data/eval data/graphs data/memories data/policies data/resources data/traces data/vectors data/teams-tenant-configs data/teams-resource-ids data/tenants

.PHONY: reset
reset: clean init codegen

.PHONY: download
download:
	@node ./scripts/demo-data.js

.PHONY: download-last
download-last:
	@node ./scripts/demo-data.js --last

# ====================
# Code Generation
# ====================

.PHONY: codegen
codegen:
	@npx --workspace=@copilot-ld/libcodegen codegen --all

.PHONY: codegen-type
codegen-type:
	@npx --workspace=@copilot-ld/libcodegen codegen --type

.PHONY: codegen-client
codegen-client:
	@npx --workspace=@copilot-ld/libcodegen codegen --client

.PHONY: codegen-service
codegen-service:
	@npx --workspace=@copilot-ld/libcodegen codegen --service

.PHONY: codegen-definition
codegen-definition:
	@npx --workspace=@copilot-ld/libcodegen codegen --definition

# ====================
# Processing
# ====================

.PHONY: transform
transform: transform-pdf

.PHONY: transform-pdf
transform-pdf:
	@npx --workspace=@copilot-ld/libtransform transform-pdf

.PHONY: ingest
ingest: ingest-load ingest-pipeline

.PHONY: ingest-load
ingest-load:
	@npx --workspace=@copilot-ld/libingest ingest-load

.PHONY: ingest-pipeline
ingest-pipeline:
	@npx --workspace=@copilot-ld/libingest ingest-pipeline

.PHONY: process
process: process-assistants process-resources process-tools process-graphs process-vectors

.PHONY: process-fast
process-fast: process-assistants process-resources process-tools process-graphs

.PHONY: process-assistants
process-assistants:
	@npx --workspace=@copilot-ld/libagent process-assistants

.PHONY: process-resources
process-resources:
	@npx --workspace=@copilot-ld/libresource process-resources

.PHONY: process-tools
process-tools:
	@node ./scripts/tools.js

.PHONY: process-vectors
process-vectors:
	@npx --workspace=@copilot-ld/libvector process-vectors

.PHONY: process-graphs
process-graphs:
	@npx --workspace=@copilot-ld/libgraph process-graphs

# ====================
# Services
# ====================

.PHONY: rc
rc:
	@npx --workspace=@copilot-ld/librc rc

.PHONY: rc-start
rc-start:
	@npx --workspace=@copilot-ld/librc rc start

.PHONY: rc-stop
rc-stop:
	@npx --workspace=@copilot-ld/librc rc stop

.PHONY: rc-restart
rc-restart:
	@npx --workspace=@copilot-ld/librc rc restart

.PHONY: rc-status
rc-status:
	@npx --workspace=@copilot-ld/librc rc status

.PHONY: service-agent
service-agent:
	@npx --node-options='--inspect-brk=9229' --workspace=@copilot-ld/agent dev

# ====================
# Docker
# ====================

.PHONY: docker
docker: docker-build docker-up

.PHONY: docker-build
docker-build:
	@. ./.env.build && docker --log-level debug compose build --no-cache

.PHONY: docker-up
docker-up:
	@docker compose up

.PHONY: docker-down
docker-down:
	@docker compose down

.PHONY: docker-upload
docker-upload:
	@docker compose up -d storage
	@MINIO_ENDPOINT=http://localhost:9000 npx --workspace=@copilot-ld/libutil upload
	@docker compose down

# ====================
# Documentation
# ====================

.PHONY: docs
docs: docs-serve

.PHONY: docs-build
docs-build:
	@npx --workspace=@copilot-ld/libdoc docs-build

.PHONY: docs-serve
docs-serve:
	@npx --workspace=@copilot-ld/libdoc docs-serve

.PHONY: docs-watch
docs-watch:
	@npx --workspace=@copilot-ld/libdoc docs-serve --watch

# ====================
# CLI Tools
# ====================

.PHONY: cli-chat
cli-chat:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/chat.js

.PHONY: cli-search
cli-search:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/search.js

.PHONY: cli-query
cli-query:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/query.js

.PHONY: cli-subjects
cli-subjects:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/subjects.js

.PHONY: cli-visualize
cli-visualize:
	@npx --workspace=@copilot-ld/libtelemetry visualize

.PHONY: cli-window
cli-window:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/window.js

.PHONY: cli-completion
cli-completion:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/completion.js

.PHONY: cli-tiktoken
cli-tiktoken:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/tiktoken.js

.PHONY: cli-unary
cli-unary:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@node ./scripts/unary.js

# ====================
# Evaluation
# ====================

.PHONY: eval
eval:
	@npx --workspace=@copilot-ld/librc rc start --silent
	@npx --workspace=@copilot-ld/libeval evaluation

.PHONY: eval-report
eval-report:
	@npx --workspace=@copilot-ld/libeval eval-report

.PHONY: eval-reset
eval-reset:
	@rm -rf data/dev.log data/cli/* data/eval/* data/memories/* data/resources/common.Conversation.* data/traces/*
	@npx --workspace=@copilot-ld/librc rc restart --silent

# ====================
# Utilities
# ====================

.PHONY: upload
upload:
	@npx --workspace=@copilot-ld/libutil upload

.PHONY: download-s3
download-s3:
	@npx --workspace=@copilot-ld/libutil download

.PHONY: ontology-topdown
ontology-topdown:
	@node ./scripts/ontology_top_down.js

.PHONY: security
security:
	@npm audit --audit-level=low --workspaces

.PHONY: spellcheck
spellcheck:
	@npx spellchecker --quiet --files '**/*.md' '**/*.html' '!examples/**' '!**/*-prompt.md' --dictionaries .dictionary.txt --no-suggestions

.PHONY: validate-html
validate-html:
	@find eval/output -name '*.html' | node scripts/validate.js

.PHONY: supabase-env
supabase-env:
	@node scripts/supabase-env.js

.PHONY: supabase-demo-user
supabase-demo-user:
	@node scripts/supabase-demo-user.js
