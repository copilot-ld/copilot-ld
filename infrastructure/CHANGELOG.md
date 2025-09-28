# Changelog

## 2025-09-28

- **NEW**: Created `docs/configuration.html` with comprehensive configuration
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
