# Build stage - includes dev dependencies for code generation
FROM node:22-alpine AS builder

WORKDIR /app/
COPY services/memory ./

# Install all dependencies (including dev dependencies) for code generation
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install

# Generate code using dev dependencies
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npx codegen --source=/app/generated

# Production stage - minimal runtime image
FROM node:22-alpine AS production

WORKDIR /app/
COPY services/memory ./

# Install only production dependencies
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install --omit=dev --omit=optional

# Copy generated code from builder stage
COPY --from=builder /app/generated ./generated

EXPOSE 3000
CMD ["npm", "run", "docker"]
