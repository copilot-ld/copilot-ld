---
title: Deployment Guide
description: |
  This guide covers how to deploy and run Copilot-LD in production using either
  Docker Compose or AWS CloudFormation. Choose the deployment method that best
  fits your infrastructure requirements.
toc: true
---

## Prerequisites

- [Processing Guide](/processing/) completed
- Docker and Docker Compose installed (for Docker deployment)
- AWS CLI configured (for CloudFormation deployment)

**Note:** For GitHub Actions workflows, ensure S3 access credentials are
configured as repository secrets.

## Docker Compose Deployment

The Docker Compose deployment provides a complete containerized stack with
application load balancing, object storage, and all microservices.

### Architecture Overview

The Docker Compose stack includes:

- **Unified Gateway**: Single nginx container providing both HTTP/HTTPS load
  balancing with SSL termination (ports 80/443) and HTTPS proxy for outbound
  internet access (port 3128) using nginx stream module
- **Object Storage**: MinIO S3-compatible storage for data persistence
- **Extension Services**: Web API interface
- **Core Services**: Agent, LLM, Memory, Vector, and Tool services
- **Custom Tools**: Example Hash service demonstrating tool extensibility

The unified gateway provides a single point for both inbound web traffic (ports
80/443) and outbound internet connectivity (port 3128). Services that need
external API access (such as the LLM service for GitHub Copilot API) route
traffic through the gateway's proxy functionality via the `HTTPS_PROXY`
environment variable.

### SSL Certificate Setup

Configure SSL certificates for secure HTTPS access. See the
[SSL Certificate Configuration](/configuration/) section in the Configuration
Guide for detailed setup instructions including self-signed certificate
generation and production certificate installation.

### Configuration

Configure environment variables and service settings. See the
[Configuration Guide](/configuration/) for complete details on all environment
variables and YAML configuration options.

### Deploy the Stack

The platform uses a unified Docker build process with a single `Dockerfile` that
handles all components (services, extensions, and tools). Building the
containers requires a GitHub Personal Access Token (PAT) with at minimum the
`read:packages` scope. Put the token in `config/.build_token` and deploy the
stack:

```bash
GITHUB_TOKEN=$(cat config/.build_token) docker compose build
docker compose up -d
docker compose ps
```

The first command builds all container images, the second starts the complete
stack, and the third checks service status.

### Access Points

Once deployed, access the system via:

- **Web Extension**: `https://localhost/web`
- **MinIO Console**: `http://localhost:9001`

## AWS CloudFormation Deployment

Deploy Copilot-LD on AWS using ECS Fargate with CloudFormation for
production-grade scalability and managed infrastructure.

### Architecture Overview

The AWS deployment uses Application Load Balancer with unified gateway container
for optimal security and cost management:

- **Application Load Balancer**: Handles SSL termination with AWS Certificate
  Manager certificates (free, auto-renewal) and routes traffic to gateway
- **Unified Gateway**: Single nginx container on public subnet providing HTTP
  ingress (port 80) and HTTPS egress proxy (port 3128)
- **SSL Management**: ALB manages SSL with AWS Certificate Manager, gateway
  serves HTTP internally
- **Private Services**: All backend services (Agent, LLM, Memory, Vector, Graph,
  Tool) run on private subnets
- **Proxy Configuration**: Services requiring external API access use the
  `HTTPS_PROXY` environment variable to route traffic through the gateway
- **Cost Benefit**: Eliminates NAT Gateway (~$32/month + $0.045/GB data charges)
  while maintaining professional SSL management via ALB (~$16/month) with AWS
  Certificate Manager

This architecture provides production-grade SSL certificate management through
AWS Certificate Manager while eliminating the expensive NAT Gateway. The gateway
handles egress proxy functionality, keeping backend services isolated on private
subnets.

### AWS OIDC Setup for GitHub Actions

Before using the GitHub Actions workflows for automated deployment, you must
configure AWS OpenID Connect (OIDC) to allow secure, keyless authentication from
GitHub Actions to your AWS account.

#### 1. Create GitHub OIDC Identity Provider in AWS

First, create an OIDC identity provider in your AWS account using AWS CLI:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --thumbprint-list 1c58a3a8518e8759bf075b76b750d4f2df264fcd
```

Or create via AWS Console:

- Navigate to **IAM → Identity providers → Add provider**
- Provider type: **OpenID Connect**
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`
- Add the thumbprints above (GitHub's current thumbprints)

**Reference:**
[GitHub Docs: Configuring OIDC in AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

#### 2. Create IAM Role for GitHub Actions

Create an IAM role that GitHub Actions can assume. Save this as
`github-actions-role.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": ["sts.amazonaws.com"]
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:copilot-ld/copilot-ld:*"
          ]
        }
      }
    }
  ]
}
```

Create the role and attach the necessary policies:

```bash
aws iam create-role \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --assume-role-policy-document file://github-actions-role.json

aws iam attach-role-policy \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --policy-arn arn:aws:iam::aws:policy/CloudFormationFullAccess

aws iam attach-role-policy \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

aws iam attach-role-policy \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-role-policy \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

aws iam attach-role-policy \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

aws iam attach-role-policy \
  --role-name GitHubActions-CopilotLD-Demo-Deploy \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

These attach CloudFormation permissions, `EC2` permissions for network
infrastructure deployment, `ECS` permissions for service deployment, `IAM`
permissions for role creation, `S3` permissions for data management, Secrets
Manager permissions, and CloudWatch Logs permissions for log group management.

**Security Note:** For production environments, replace `*FullAccess` policies
with more restrictive, principle-of-least-privilege policies tailored to your
specific deployment needs.

#### 3. Configure GitHub Repository Secrets

Add the following secrets to your GitHub repository (**Settings → Secrets and
variables → Actions**):

- **DEMO_AWS_DEPLOY_ROLE_ARN**:
  `arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActions-CopilotLD-Demo-Deploy`
- **DEMO_GITHUB_TOKEN**: Personal access token for GitHub API access (required
  for some workflows)

#### 4. Workflow Usage

The configured OIDC role enables secure access in four deployment workflows:

- **demo-network.yml**: Deploys VPC network infrastructure including subnets,
  routing tables, ECS cluster, and unified nginx gateway (replaces ALB and NAT
  Gateway for cost optimization)
- **demo-secrets.yml**: Deploys AWS Secrets Manager secrets for GitHub tokens
  and service authentication
- **demo-data.yml**: Generates demo data artifacts (configuration, knowledge
  base, tools) for deployment
- **demo-storage.yml**: Creates S3 storage infrastructure and IAM roles for data
  access
- **demo-services.yml**: Deploys the complete ECS service stack (backend
  services only, gateway deployed with network)

For detailed CloudFormation deployment commands and parameters, refer to the
actual workflow files in `.github/workflows/`. These workflows contain the most
current deployment procedures and parameter configurations.

**Reference:**
[AWS Docs: Creating OIDC Identity Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)

### Automated Deployment

Use the GitHub Actions workflows for automated deployment. The workflows handle
all CloudFormation stack creation, parameter management, and deployment
orchestration. See the workflow files for specific implementation details and
current deployment procedures.

### Deployment Order

Deploy the CloudFormation stacks in the following order using the GitHub Actions
workflows:

- **Network Infrastructure**: Deploy `demo-network.yml` workflow first to create
  the VPC, subnets, routing infrastructure, ECS cluster, and unified nginx
  gateway (ALB and NAT Gateway eliminated for cost optimization)
- **Secrets Management**: Deploy `demo-secrets.yml` workflow to create AWS
  Secrets Manager resources for secure credential storage
- **Data Generation**: Run `demo-data.yml` workflow to generate demo data
  artifacts including processed knowledge base, configuration, and tools
- **Storage Infrastructure**: Deploy `demo-storage.yml` workflow to create S3
  bucket and IAM roles for data access
- **Data Upload**: Deploy `demo-upload.yml` workflow to upload generated demo
  data to the storage infrastructure
- **Services**: Deploy `demo-services.yml` workflow to create backend ECS
  services and application infrastructure

Each stack outputs the necessary parameters for the next stack in the deployment
chain. The network stack provides VPC and subnet IDs required by the services
stack.

### Data Upload

Upload your processed knowledge base to S3 for deployment. For complete data
management instructions including upload configuration, download utilities, and
storage management, see the [Data Management Utilities](/processing/) section in
the Processing Guide.

## Production Considerations

### Security

- **SSL Certificates**: Use valid TLS certificates from a trusted CA
- **GitHub Actions OIDC**: Use OIDC authentication instead of long-lived AWS
  access keys for secure, keyless deployment from GitHub Actions
- **Secret Management**: Store GitHub tokens in AWS Secrets Manager or similar
- **Network Security**: Configure VPC security groups and NACLs appropriately
- **Service Authentication**: Rotate service secrets regularly
- **IAM Role Policies**: Use principle of least privilege for GitHub Actions
  deployment role and ECS service roles

## Next Steps

Once deployment is complete, you can proceed with extending or customizing the
system:

- [Development Guide](/development/) - Run locally with live reloading
