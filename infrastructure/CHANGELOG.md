# Changelog

## 2026-01-26

- **BREAKING**: Reorganized Docker Compose with optional storage/auth profiles
  (`--profile minio`, `--profile supabase`)
- Added JWT secret management to CloudFormation stacks (`secrets.yml`,
  `services.yml`, `extensions.yml`)
- Container naming now follows `{service}-{provider}` pattern (e.g.,
  `storage-minio`, `auth-supabase`)

## 2025-11-25

- Added `UiService` and related resources to `extensions.yml`
- Configured ALB routing for `/ui/*` to `UiService`
- Reverted `WebTargetGroup` health check to `/web/health`

## 2025-11-21

- **BREAKING**: Separated ALB and gateway containers to mirror AWS architecture
  where SSL offloading happens at ALB level, not gateway
- **NEW**: Created `infrastructure/docker/alb/` with dedicated nginx container
  for SSL termination and HTTP/HTTPS routing (ports 80/443)
- **SIMPLIFIED**: Updated `infrastructure/docker/gateway/` to handle only egress
  proxy functionality (port 3128), removing SSL and ingress routing
- **NEW**: Created `infrastructure/docker/shared/` for common nginx
  configuration files shared between ALB and gateway
- **UPDATED**: Modified `docker-compose.yml` to include separate `alb` and
  `gateway` services
- **IMPROVED**: Local Docker Compose setup now mirrors AWS deployment
  architecture more closely
- **FIXED**: Resolved issue where AWS infrastructure was incorrectly using
  unified gateway image that included SSL offloading

## 2025-10-08

- **FIXED**: Service discovery namespace in `network.yml` now uses simple
  `copilot-ld.local` name instead of `${EnvironmentName}.copilot-ld.local` to
  match client hostname resolution expectations
- **IMPROVED**: Services are now discoverable at expected addresses like
  `agent.copilot-ld.local`, `memory.copilot-ld.local`, etc.

## 2025-10-07

- **FIXED**: Added `Ensure data directories exist` step to `demo-upload.yml`
  workflow to resolve "Could not find bucket: memories" error
- **ENHANCED**: The upload step now runs `npm run init` after downloading the
  demo data artifact to ensure all required directories exist
- **IMPROVED**: Data upload workflow is now more robust against directory
  structure variations in artifacts

## 2025-10-02

- **UNIFIED**: Consolidated multiple component-specific `Dockerfile` files into
  single unified `Dockerfile`
- **ENHANCED**: Added `COMPONENT_PATH` build argument for flexible component
  building
- **SIMPLIFIED**: Updated `docker-compose.yml` to use unified `Dockerfile` with
  component-specific build arguments
- **SIMPLIFIED**: Updated `.github/workflows/release.yml` to use unified Docker
  build process
- **IMPROVED**: Eliminated duplicate Docker configuration across services,
  extensions, and tools

- **FIXED**: Added VPC endpoints to `network.yml` CloudFormation template to
  resolve ECS tasks' inability to access AWS Secrets Manager from private
  subnets
- **NEW**: Created `VPCEndpointSecurityGroup` in network infrastructure to allow
  HTTPS traffic from ECS services to VPC endpoints
- **NEW**: Added VPC endpoints for `secretsmanager`, `s3`, `ecr.api`, `ecr.dkr`,
  and `logs` services to enable private subnet connectivity
- **ARCHITECTURE**: VPC endpoints properly located in network layer as shared
  infrastructure for both services and extensions
- **ENHANCED**: Both `services.yml` and `extensions.yml` deployments now benefit
  from shared VPC endpoint infrastructure
- **IMPROVED**: Reduced deployment costs by eliminating unnecessary internet
  traffic for AWS service communication

## 2025-09-30

- **FIXED**: Removed `S3_BUCKET_ROLE_ARN` environment variable from all ECS task
  definitions since containers already run with the role via `TaskRoleArn`
- **SIMPLIFIED**: Application code now relies on default AWS credential chain
  when no explicit credentials are provided, eliminating role assumption
  conflicts
- **NEW**: Created minimal `network.yml` CloudFormation template for VPC and
  networking infrastructure
- **NEW**: Added `demo-network.yml` GitHub workflow for automated network
  deployment
- **SIMPLIFIED**: Minimal template uses hardcoded CIDR blocks and single NAT
  Gateway for cost efficiency
- **ARCHITECTURE**: Provides essential networking requirements for
  `services.yml` deployment
- **OUTPUTS**: Added three core outputs: `VpcId`, `PublicSubnetIds`,
  `PrivateSubnetIds`
- **ENHANCED**: Standardized all demo workflow outputs with consistent
  formatting and step indicators
- **IMPROVED**: Added cohesive deployment messaging that clearly shows
  progression through 4-step deployment process

## 2025-09-28

- **NEW**: Created `secrets.yml` CloudFormation template for AWS Secrets Manager
  integration
- **ENHANCED**: Updated `services.yml` to use AWS Secrets Manager for
  `GITHUB_TOKEN` and `SERVICE_SECRET`
- **NEW**: Added `demo-secrets.yml` GitHub workflow for automated secrets
  deployment
- **IMPROVED**: Enhanced `scripts/secret.js` with `--output-only` flag for CI/CD
  integration
- **SECURITY**: Removed plain text secrets from CloudFormation parameters in
  favor of secure ARN references
- **NEW**: Created `docs/configuration.html` with comprehensive configuration
- **STANDARDIZED**: Updated `demo-secrets.yml` workflow to use consistent
  `AWS_DEPLOY_ROLE_ARN` secret name
- **DOCUMENTATION**: Added comprehensive AWS OIDC setup guide to
  `docs/deployment.html` with step-by-step configuration instructions
  documentation consolidating all environment variables and YAML configuration
- **ENHANCED**: Updated all documentation navigation to include Configuration
  guide ordered before Development and Deployment
- **IMPROVED**: Removed scattered configuration content from `README.md`,
  `development.html`, and `deployment.html` with references to centralized
  configuration guide
- **BREAKING**: Updated CloudFormation `services.yml` to use `S3_DATA_BUCKET`
  environment variable instead of `DATA_BUCKET_NAME`
- **ENHANCED**: Standardized S3 bucket environment variable naming scheme to
  support future multiple bucket types
- **IMPROVED**: Consolidated all task definitions (web, agent, memory) to use
  consistent `S3_DATA_BUCKET` naming
- Updated `.github/instructions/documentation.instructions.md` to reflect
  four-file documentation structure
- Added `docs/deployment.html` with comprehensive Docker Compose and AWS
  CloudFormation deployment guides
- Renamed `docs/getting-started.html` to `docs/development.html` focused on
  development workflow
- Updated all HTML navigation links to include Development and Deployment
  sections

## 2025-09-27

- Added initial CloudFormation templates
