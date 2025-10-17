# Hash Tool Service

A standalone hash tool service providing SHA-256 and MD5 hashing functionality
for the Copilot-LD platform.

## Setup

This service is designed to be completely independent from the main workspace
and consumes published packages as a public consumer would.

### Prerequisites

1. Node.js 22.0.0 or higher
2. GitHub personal access token with `read:packages` permission

### Installation

1. Set your GitHub personal access token as an environment variable:

   ```bash
   export GITHUB_TOKEN=your_github_personal_access_token_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Service

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Authentication for GitHub Packages

This service consumes packages from GitHub Packages registry
(`npm.pkg.github.com`). Even for public packages, GitHub requires
authentication.

### Creating a GitHub Personal Access Token

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens
   (classic)
2. Generate a new token with `read:packages` permission
3. Copy the token and set it as the `GITHUB_TOKEN` environment variable

### Alternative: Using `.npmrc` with token

If you prefer to store the token in a file (not recommended for production):

```bash
echo "//npm.pkg.github.com/:_authToken=your_token_here" >> ~/.npmrc
```

## Docker Support

The service includes a Dockerfile for containerized deployment. The GITHUB_TOKEN
can be passed as a build argument:

```bash
docker build --build-arg GITHUB_TOKEN=$GITHUB_TOKEN -t hash-service .
```

## API

The service implements the hash tool protocol as defined in `../hash.proto`.
