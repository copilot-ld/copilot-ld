# Changelog

## 2025-10-01

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
